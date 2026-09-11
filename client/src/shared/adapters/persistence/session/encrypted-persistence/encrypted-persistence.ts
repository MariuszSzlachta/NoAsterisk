import { encryptRecord } from '#shared/adapters/persistence/crypto';
import {
  createPersistenceCryptoError,
  createPersistenceLockedError,
} from '#shared/adapters/persistence/crypto/errors';
import {
  BudgetDatabase,
  createEncryptedDexieRepository,
  deleteMatchingRecords,
  encryptedDatabase,
  getAccountDatabaseName,
  putManyIfAbsentWithRelated as putManyIfAbsentWithRelatedInDexie,
} from '#shared/adapters/persistence/dexie';
import { migrateLegacyLocalStorage } from '#shared/adapters/persistence/migrations';
import type {
  EncryptedCollectionWrite,
  EncryptedCollectionWriteIfAbsent,
  EncryptedRelatedWrite,
  EncryptedRepository,
  EncryptedWriteResult,
  PersistenceCollection,
} from '#shared/adapters/persistence/ports';
import { createDatabaseLock } from '#shared/adapters/persistence/session/database-lock';
import { initializePersistenceMetadata } from '#shared/adapters/persistence/session/initialize-metadata';
import { createPersistenceChannel } from '#shared/adapters/persistence/session/persistence-channel';
import { createPersistenceSnapshot } from '#shared/adapters/persistence/session/persistence-snapshot';
import { clearPersistenceStorage } from '#shared/adapters/persistence/session/persistence-storage';
import { getPersistenceRecordId } from '#shared/adapters/persistence/session/record-with-id';
import {
  type EncryptedPersistence,
  type PersistentStorageStatus,
} from '#shared/adapters/persistence/session/session-types';
import { persistenceSyncMetadata } from '#shared/adapters/persistence/sync-metadata';

export const createEncryptedPersistence = (
  database: BudgetDatabase = encryptedDatabase,
): EncryptedPersistence => {
  const databaseLock = createDatabaseLock();
  const session = createPersistenceSnapshot();
  let activeDatabase = database;
  let accountNamespace = 'anonymous';
  // Mutable by design: locking and fail-closed paths must be able to erase the in-memory key.
  let key: CryptoKey | undefined;
  const channel = createPersistenceChannel(() => {
    key = undefined;
    activeDatabase.close();
    session.setSnapshot({
      status: 'locked',
      error: undefined,
      warning: undefined,
    });
  });

  const requireKey = (): CryptoKey => {
    if (key !== undefined) {
      return key;
    }
    throw createPersistenceLockedError();
  };

  const setAccountContext = (userId: string, workspaceId: string): void => {
    if (userId.length === 0 || workspaceId.length === 0) {
      throw new Error('Persistence account context cannot be empty');
    }
    const nextNamespace = `${userId}:${workspaceId}`;
    if (accountNamespace === nextNamespace) {
      return;
    }
    key = undefined;
    activeDatabase.close();
    activeDatabase = new BudgetDatabase(
      getAccountDatabaseName(userId, workspaceId),
    );
    accountNamespace = nextNamespace;
    persistenceSyncMetadata.setNamespace(accountNamespace);
    session.setSnapshot({
      status: 'locked',
      error: undefined,
      warning: undefined,
    });
  };

  const repository = <TRecord extends object>(
    collection: PersistenceCollection,
    validator: (value: unknown) => value is TRecord,
    getId: (record: TRecord) => string,
  ): EncryptedRepository<TRecord> =>
    createEncryptedDexieRepository(
      () => activeDatabase,
      collection,
      requireKey,
      validator,
      getId,
      databaseLock,
    );

  const requestPersistentStorage =
    async (): Promise<PersistentStorageStatus> => {
      if (
        typeof navigator === 'undefined' ||
        !navigator.storage ||
        typeof navigator.storage.persist !== 'function'
      ) {
        session.setSnapshot({ storage: 'unavailable' });
        return 'unavailable';
      }

      try {
        const storage: PersistentStorageStatus =
          (await navigator.storage.persist()) ? 'granted' : 'denied';
        session.setSnapshot({ storage });
        return storage;
      } catch {
        session.setSnapshot({ storage: 'unavailable' });
        return 'unavailable';
      }
    };

  const unlock = async (
    passphrase: string,
    hydrate?: () => Promise<void>,
  ): Promise<void> => {
    if (passphrase.length === 0) {
      throw createPersistenceCryptoError('Vault passphrase cannot be empty');
    }

    session.setSnapshot({
      status: 'unlocking',
      error: undefined,
      warning: undefined,
    });
    try {
      const warning = await databaseLock(async () => {
        await activeDatabase.open();
        const initialized = await initializePersistenceMetadata(
          activeDatabase,
          passphrase,
        );
        key = initialized.key;
        const migration = await migrateLegacyLocalStorage(
          activeDatabase,
          initialized.key,
          initialized.metadata,
        );
        if (hydrate !== undefined) {
          await hydrate();
        }
        return migration.warning;
      });

      session.setSnapshot({ status: 'unlocked', error: undefined, warning });
      channel.broadcast('session-unlocked');
    } catch (error) {
      key = undefined;
      activeDatabase.close();
      const message =
        error instanceof Error ? error.message : 'Unable to unlock local data';
      session.setSnapshot({
        status: 'error',
        error: message,
        warning: undefined,
      });
      throw error;
    }
  };

  const lock = (): void => {
    key = undefined;
    activeDatabase.close();
    session.setSnapshot({
      status: 'locked',
      error: undefined,
      warning: undefined,
    });
    channel.broadcast('session-locked');
  };

  const failClosed = (error: unknown): void => {
    key = undefined;
    activeDatabase.close();
    const message =
      error instanceof Error
        ? error.message
        : 'Encrypted persistence write failed';
    session.setSnapshot({
      status: 'error',
      error: message,
      warning: undefined,
    });
    channel.broadcast('session-locked');
  };

  const clearLocalData = async (options?: {
    readonly removePreferences?: boolean;
  }): Promise<void> => {
    await databaseLock(async () => {
      key = undefined;
      activeDatabase.close();
      channel.broadcast('database-deleting');
      await activeDatabase.delete();
      clearPersistenceStorage(options?.removePreferences === true);
    });

    session.setSnapshot({
      status: 'locked',
      error: undefined,
      warning: undefined,
    });
    channel.broadcast('database-deleted');
  };

  const replaceCollections = async (
    writes: ReadonlyArray<EncryptedCollectionWrite>,
  ): Promise<void> => {
    await databaseLock(async () => {
      const currentKey = requireKey();
      // Encryption runs in parallel without side effects. The IndexedDB transaction
      // starts only after every record is encrypted, so one rejected promise writes nothing.
      const encryptedWrites = await Promise.all(
        writes.map(async (write) => ({
          collection: write.collection,
          records: await Promise.all(
            write.records.map((record) =>
              encryptRecord(
                write.collection,
                getPersistenceRecordId(record),
                record,
                currentKey,
              ),
            ),
          ),
        })),
      );

      await activeDatabase.transaction(
        'rw',
        activeDatabase.records,
        async () => {
          await encryptedWrites.reduce(async (previous, write) => {
            await previous;
            await activeDatabase.records
              .where('collection')
              .equals(write.collection)
              .delete();
            await activeDatabase.records.bulkPut(write.records);
          }, Promise.resolve());
        },
      );
      persistenceSyncMetadata.markDirty();
    });
  };

  const putManyIfAbsentWithRelated = async <
    TRecord extends object,
    TRelated extends object,
  >(
    primaryWrite: EncryptedCollectionWriteIfAbsent<TRecord>,
    createRelatedWrite: (
      result: EncryptedWriteResult<TRecord>,
    ) => EncryptedRelatedWrite<TRelated>,
  ): Promise<EncryptedWriteResult<TRecord>> => {
    const result = await putManyIfAbsentWithRelatedInDexie(
      activeDatabase,
      requireKey,
      primaryWrite,
      createRelatedWrite,
      databaseLock,
    );
    if (result.written.length > 0) {
      persistenceSyncMetadata.markDirty();
    }
    return result;
  };

  return {
    setAccountContext,
    getSnapshot: session.getSnapshot,
    subscribe: session.subscribe,
    isUnlocked: () => key !== undefined,
    requireKey,
    repository,
    requestPersistentStorage,
    unlock,
    lock,
    failClosed,
    clearLocalData,
    replaceCollections,
    putManyIfAbsentWithRelated,
    deleteMatchingRecords: async (deletions) => {
      await deleteMatchingRecords(
        activeDatabase,
        requireKey,
        deletions,
        databaseLock,
      );
      persistenceSyncMetadata.markDirty();
    },
  };
};
