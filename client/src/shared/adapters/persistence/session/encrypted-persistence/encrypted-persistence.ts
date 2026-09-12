import { encryptRecord } from '#shared/adapters/persistence/crypto';
import {
  createPersistenceCryptoError,
  createPersistenceLockedError,
} from '#shared/adapters/persistence/crypto/errors';
import {
  BudgetDatabase,
  createEncryptedDexieRepository,
  createVaultV2Repository,
  deleteMatchingRecords,
  encryptedDatabase,
  getAccountDatabaseName,
  putManyIfAbsentWithRelated as putManyIfAbsentWithRelatedInDexie,
  rotateVaultRecords,
  VaultV2Database,
  type VaultV2RotationJournal,
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
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { passkeyUnlockHandoff } from '#shared/adapters/webauthn/passkey-unlock-handoff';

export const createEncryptedPersistence = (
  database: BudgetDatabase = encryptedDatabase,
): EncryptedPersistence => {
  const generateSigningKeyPair = async (): Promise<CryptoKeyPair> => {
    const generated = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign', 'verify'],
    );
    return { privateKey: generated.privateKey, publicKey: generated.publicKey };
  };
  const databaseLock = createDatabaseLock();
  const session = createPersistenceSnapshot();
  let activeDatabase = database;
  let accountNamespace = 'anonymous';
  // Mutable by design: locking and fail-closed paths must be able to erase the in-memory key.
  let key: CryptoKey | undefined;
  let syncKey: CryptoKey | undefined;
  let signingKey: CryptoKey | undefined;
  let verifyKey: CryptoKey | undefined;
  let activeVmk: Uint8Array | undefined;
  const clearActiveVmk = (): void => {
    activeVmk?.fill(0);
    activeVmk = undefined;
  };
  let generation = 0;
  let activeVaultDatabase: VaultV2Database | undefined;
  let activeGeneration = -1;
  let vaultContext:
    | {
        readonly accountId: string;
        readonly workspaceId: string;
        readonly vaultId: string;
        readonly keyId: string;
        readonly deviceId: string;
      }
    | undefined;
  const channel = createPersistenceChannel(() => {
    generation += 1;
    passkeyUnlockHandoff.clear();
    key = undefined;
    syncKey = undefined;
    signingKey = undefined;
    verifyKey = undefined;
    clearActiveVmk();
    activeVaultDatabase?.close();
    activeVaultDatabase = undefined;
    activeGeneration = -1;
    vaultContext = undefined;
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

  const readVaultLocalShare = async (context: {
    readonly accountId: string;
    readonly workspaceId: string;
    readonly vaultId: string;
    readonly keyId: string;
    readonly deviceId: string;
  }): Promise<CryptoKey | undefined> => {
    const database = new VaultV2Database(
      context.accountId,
      context.workspaceId,
      context.vaultId,
    );
    await database.open();
    try {
      const metadata = await database.metadata.get('vault');
      const contextMatchesPendingRotation =
        metadata?.pendingRotation?.currentKeyId === context.keyId &&
        metadata.keyId === metadata.pendingRotation.nextKeyId;
      if (
        metadata === undefined ||
        metadata.accountId !== context.accountId ||
        metadata.workspaceId !== context.workspaceId ||
        metadata.vaultId !== context.vaultId ||
        (metadata.keyId !== context.keyId && !contextMatchesPendingRotation) ||
        metadata.deviceId !== context.deviceId
      )
        return undefined;
      return metadata.localShare;
    } finally {
      database.close();
    }
  };

  const removeVaultLocalShare = async (context: {
    readonly accountId: string;
    readonly workspaceId: string;
    readonly vaultId: string;
    readonly keyId: string;
    readonly deviceId: string;
  }): Promise<void> => {
    const database = new VaultV2Database(
      context.accountId,
      context.workspaceId,
      context.vaultId,
    );
    await database.open();
    try {
      const metadata = await database.metadata.get('vault');
      if (
        metadata === undefined ||
        metadata.accountId !== context.accountId ||
        metadata.workspaceId !== context.workspaceId ||
        metadata.vaultId !== context.vaultId ||
        metadata.keyId !== context.keyId ||
        metadata.deviceId !== context.deviceId
      )
        return;
      const { localShare: _localShare, ...withoutLocalShare } = metadata;
      await database.metadata.put(withoutLocalShare);
    } finally {
      database.close();
    }
  };

  const storeVaultLocalShare = async (
    context: {
      readonly accountId: string;
      readonly workspaceId: string;
      readonly vaultId: string;
      readonly keyId: string;
      readonly deviceId: string;
    },
    localShare: CryptoKey,
  ): Promise<void> => {
    const database = new VaultV2Database(
      context.accountId,
      context.workspaceId,
      context.vaultId,
    );
    await database.open();
    try {
      const metadata = await database.metadata.get('vault');
      if (
        metadata === undefined ||
        metadata.accountId !== context.accountId ||
        metadata.workspaceId !== context.workspaceId ||
        metadata.vaultId !== context.vaultId ||
        metadata.keyId !== context.keyId ||
        metadata.deviceId !== context.deviceId
      )
        throw new Error('Vault metadata context mismatch');
      await database.metadata.put({ ...metadata, localShare });
    } finally {
      database.close();
    }
  };

  const setAccountContext = (userId: string, workspaceId: string): void => {
    if (userId.length === 0 || workspaceId.length === 0) {
      throw new Error('Persistence account context cannot be empty');
    }
    const nextNamespace = `${userId}:${workspaceId}`;
    if (accountNamespace === nextNamespace) {
      return;
    }
    generation += 1;
    passkeyUnlockHandoff.clear();
    key = undefined;
    syncKey = undefined;
    signingKey = undefined;
    verifyKey = undefined;
    clearActiveVmk();
    activeVaultDatabase?.close();
    activeVaultDatabase = undefined;
    activeGeneration = -1;
    vaultContext = undefined;
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

  const getVaultTransferMaterial = (context: {
    readonly accountId: string;
    readonly workspaceId: string;
    readonly vaultId: string;
    readonly keyId: string;
    readonly deviceId: string;
  }) => {
    if (
      activeVmk === undefined ||
      signingKey === undefined ||
      verifyKey === undefined ||
      vaultContext === undefined ||
      vaultContext.accountId !== context.accountId ||
      vaultContext.workspaceId !== context.workspaceId ||
      vaultContext.vaultId !== context.vaultId ||
      vaultContext.keyId !== context.keyId ||
      vaultContext.deviceId !== context.deviceId
    )
      throw createPersistenceLockedError();
    return {
      vmk: activeVmk.slice(),
      signingKey,
      signingPublicKey: verifyKey,
    };
  };

  const repository = <TRecord extends object>(
    collection: Exclude<PersistenceCollection, 'sentinel'>,
    validator: (value: unknown) => value is TRecord,
    getId: (record: TRecord) => string,
  ): EncryptedRepository<TRecord> => {
    if (activeVaultDatabase !== undefined && vaultContext !== undefined) {
      return createVaultV2Repository(
        activeVaultDatabase,
        collection,
        requireKey,
        validator,
        getId,
        vaultContext,
        databaseLock,
        () => generation === activeGeneration,
        () => persistenceSyncMetadata.markDirty(),
      );
    }
    return createEncryptedDexieRepository(
      () => activeDatabase,
      collection,
      requireKey,
      validator,
      getId,
      databaseLock,
    );
  };

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
    if (accountNamespace !== 'anonymous') {
      throw createPersistenceCryptoError(
        'Passphrase unlock is unavailable for Vault Protocol v2 accounts',
      );
    }
    if (passphrase.length === 0) {
      throw createPersistenceCryptoError('Vault passphrase cannot be empty');
    }

    const unlockGeneration = ++generation;
    syncKey = undefined;
    signingKey = undefined;
    verifyKey = undefined;
    session.setSnapshot({
      status: 'unlocking',
      error: undefined,
      warning: undefined,
    });
    try {
      const warning = await databaseLock(async () => {
        await activeDatabase.open();
        if (generation !== unlockGeneration)
          throw createPersistenceLockedError();
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
        if (generation !== unlockGeneration)
          throw createPersistenceLockedError();
        return migration.warning;
      });

      session.setSnapshot({ status: 'unlocked', error: undefined, warning });
      channel.broadcast('session-unlocked');
    } catch (error) {
      key = undefined;
      syncKey = undefined;
      signingKey = undefined;
      verifyKey = undefined;
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

  const unlockWithVaultKeys = async (
    vaultKeys: {
      readonly local: CryptoKey;
      readonly sync: CryptoKey;
      readonly check: CryptoKey;
      readonly localShare?: CryptoKey;
      readonly signingKeyPair?: CryptoKeyPair;
      readonly vmk?: Uint8Array;
    },
    context: {
      readonly accountId: string;
      readonly workspaceId: string;
      readonly vaultId: string;
      readonly keyId: string;
      readonly deviceId: string;
    },
    hydrate?: (isActive: () => boolean) => Promise<void>,
  ): Promise<void> => {
    const unlockGeneration = ++generation;
    session.setSnapshot({
      status: 'unlocking',
      error: undefined,
      warning: undefined,
    });
    try {
      await databaseLock(async () => {
        const database = new VaultV2Database(
          context.accountId,
          context.workspaceId,
          context.vaultId,
        );
        await database.open();
        activeVaultDatabase = database;
        if (generation !== unlockGeneration) {
          database.close();
          activeVaultDatabase = undefined;
          throw createPersistenceLockedError();
        }
        const existingMetadata = await database.metadata.get('vault');
        let effectiveVaultKeys = vaultKeys;
        let effectiveContext = context;
        if (
          existingMetadata?.pendingRotation !== undefined &&
          existingMetadata.keyId ===
            existingMetadata.pendingRotation.nextKeyId &&
          context.keyId === existingMetadata.pendingRotation.currentKeyId
        ) {
          const currentRotationContext = {
            accountId: context.accountId,
            workspaceId: context.workspaceId,
            vaultId: context.vaultId,
            keyId: existingMetadata.pendingRotation.currentKeyId,
          };
          const serializedVmk = await vaultProtocol.decryptRecord(
            existingMetadata.pendingRotation.currentVmkEnvelope,
            {
              ...currentRotationContext,
              collection: '__vault_rotation__',
              recordId: 'next-vmk',
            },
            vaultKeys.local,
          );
          const parsedVmk: unknown = JSON.parse(serializedVmk);
          if (
            !Array.isArray(parsedVmk) ||
            parsedVmk.length !== 32 ||
            !parsedVmk.every(
              (value): value is number =>
                Number.isInteger(value) && value >= 0 && value <= 255,
            )
          )
            throw createPersistenceCryptoError(
              'Invalid pending vault rotation',
            );
          const pendingVmk = new Uint8Array(parsedVmk);
          const nextRotationContext = {
            ...context,
            keyId: existingMetadata.pendingRotation.nextKeyId,
          };
          effectiveVaultKeys = {
            vmk: pendingVmk.slice(),
            ...(await vaultProtocol.deriveKeys(
              pendingVmk,
              nextRotationContext,
            )),
            ...(vaultKeys.localShare === undefined
              ? {}
              : { localShare: vaultKeys.localShare }),
            ...(vaultKeys.signingKeyPair === undefined
              ? {}
              : { signingKeyPair: vaultKeys.signingKeyPair }),
          };
          effectiveContext = nextRotationContext;
          pendingVmk.fill(0);
        }
        if (existingMetadata !== undefined) {
          await vaultProtocol.verifySentinel(
            existingMetadata.sentinel,
            {
              accountId: effectiveContext.accountId,
              workspaceId: effectiveContext.workspaceId,
              vaultId: effectiveContext.vaultId,
              keyId: effectiveContext.keyId,
            },
            effectiveVaultKeys.check,
          );
        }
        const signingKeyPair =
          existingMetadata?.signingKeyPair ??
          effectiveVaultKeys.signingKeyPair ??
          (await generateSigningKeyPair());
        const newSentinel =
          existingMetadata === undefined
            ? await vaultProtocol.createSentinel(
                {
                  accountId: effectiveContext.accountId,
                  workspaceId: effectiveContext.workspaceId,
                  vaultId: effectiveContext.vaultId,
                  keyId: effectiveContext.keyId,
                },
                effectiveVaultKeys.check,
              )
            : undefined;
        if (generation !== unlockGeneration)
          throw createPersistenceLockedError();
        key = effectiveVaultKeys.local;
        syncKey = effectiveVaultKeys.sync;
        signingKey = signingKeyPair.privateKey;
        verifyKey = signingKeyPair.publicKey;
        clearActiveVmk();
        activeVmk = effectiveVaultKeys.vmk?.slice();
        vaultContext = effectiveContext;
        activeGeneration = unlockGeneration;
        if (existingMetadata === undefined) {
          if (newSentinel === undefined)
            throw createPersistenceCryptoError('Vault sentinel is unavailable');
          if (generation !== unlockGeneration)
            throw createPersistenceLockedError();
          await database.metadata.put({
            id: 'vault',
            protocolVersion: 2,
            accountId: context.accountId,
            workspaceId: context.workspaceId,
            vaultId: context.vaultId,
            keyId: context.keyId,
            deviceId: context.deviceId,
            createdAt: Date.now(),
            ...(vaultKeys.localShare === undefined
              ? {}
              : { localShare: vaultKeys.localShare }),
            signingKeyPair,
            sentinel: newSentinel,
          });
        } else {
          if (generation !== unlockGeneration)
            throw createPersistenceLockedError();
          const {
            localShare: _existingLocalShare,
            ...metadataWithoutLocalShare
          } = existingMetadata;
          await database.metadata.put({
            ...metadataWithoutLocalShare,
            ...(vaultKeys.localShare === undefined
              ? {}
              : { localShare: vaultKeys.localShare }),
            signingKeyPair,
          });
        }
      });
      if (generation !== unlockGeneration) throw createPersistenceLockedError();
      if (hydrate !== undefined)
        await hydrate(
          () =>
            generation === unlockGeneration &&
            activeGeneration === unlockGeneration,
        );
      if (generation !== unlockGeneration) throw createPersistenceLockedError();
      session.setSnapshot({
        status: 'unlocked',
        error: undefined,
        warning: undefined,
      });
      channel.broadcast('session-unlocked');
    } catch (error) {
      const isCurrentUnlock = generation === unlockGeneration;
      if (!isCurrentUnlock) throw error;
      key = undefined;
      syncKey = undefined;
      signingKey = undefined;
      verifyKey = undefined;
      clearActiveVmk();
      activeVaultDatabase?.close();
      activeVaultDatabase = undefined;
      activeGeneration = -1;
      vaultContext = undefined;
      activeDatabase.close();
      session.setSnapshot({
        status: 'error',
        error:
          error instanceof Error
            ? error.message
            : 'Unable to unlock local data',
        warning: undefined,
      });
      throw error;
    }
  };

  const rotateVaultKeys = async (
    vaultKeys: {
      readonly local: CryptoKey;
      readonly sync: CryptoKey;
      readonly check: CryptoKey;
      readonly localShare: CryptoKey | null;
    },
    context: {
      readonly accountId: string;
      readonly workspaceId: string;
      readonly vaultId: string;
      readonly keyId: string;
      readonly deviceId: string;
    },
    rotation?: {
      readonly idempotencyKey: string;
      readonly envelopePurpose: 'device-wrap' | 'passkey-wrap';
      readonly envelope: string;
      readonly passkeyEnvelope?: string;
      readonly nextVmk: Uint8Array;
    },
  ): Promise<void> => {
    await databaseLock(async () => {
      if (
        activeVaultDatabase === undefined ||
        vaultContext === undefined ||
        key === undefined
      )
        throw createPersistenceLockedError();
      const rotationGeneration = activeGeneration;
      await rotateVaultRecords.rotate({
        database: activeVaultDatabase,
        currentKey: key,
        nextKey: vaultKeys.local,
        nextCheckKey: vaultKeys.check,
        currentContext: vaultContext,
        nextContext: context,
        nextLocalShare: vaultKeys.localShare,
        ...(rotation === undefined ? {} : { pendingRotation: rotation }),
        isSessionActive: () =>
          generation === rotationGeneration &&
          activeGeneration === rotationGeneration,
      });
      if (generation !== rotationGeneration)
        throw createPersistenceLockedError();
      key = vaultKeys.local;
      syncKey = vaultKeys.sync;
      clearActiveVmk();
      if (rotation !== undefined) activeVmk = rotation.nextVmk.slice();
      vaultContext = context;
      persistenceSyncMetadata.resetForRotation();
    });
  };

  const verifyVaultVmk = async (
    vmk: Uint8Array,
    context: {
      readonly accountId: string;
      readonly workspaceId: string;
      readonly vaultId: string;
      readonly keyId: string;
      readonly deviceId: string;
    },
  ): Promise<void> => {
    await databaseLock(async () => {
      if (activeVaultDatabase === undefined)
        throw createPersistenceLockedError();
      const metadata = await activeVaultDatabase.metadata.get('vault');
      if (metadata === undefined)
        throw createPersistenceCryptoError('Vault metadata is missing');
      const keys = await vaultProtocol.deriveKeys(vmk, context);
      if (metadata.keyId === context.keyId) {
        await vaultProtocol.verifySentinel(
          metadata.sentinel,
          {
            accountId: context.accountId,
            workspaceId: context.workspaceId,
            vaultId: context.vaultId,
            keyId: context.keyId,
          },
          keys.check,
        );
        return;
      }
      if (
        metadata.pendingRotation?.currentKeyId !== context.keyId ||
        metadata.pendingRotation.nextKeyId !== metadata.keyId
      )
        throw createPersistenceCryptoError('Vault key context mismatch');
      const serializedVmk = await vaultProtocol.decryptRecord(
        metadata.pendingRotation.currentVmkEnvelope,
        {
          accountId: context.accountId,
          workspaceId: context.workspaceId,
          vaultId: context.vaultId,
          keyId: context.keyId,
          collection: '__vault_rotation__',
          recordId: 'next-vmk',
        },
        keys.local,
      );
      const parsed: unknown = JSON.parse(serializedVmk);
      if (
        !Array.isArray(parsed) ||
        parsed.length !== vmk.length ||
        !parsed.every((value, index): value is number => value === vmk[index])
      )
        throw createPersistenceCryptoError(
          'Vault recovery does not match active key',
        );
    });
  };

  const getPendingVaultRotation = async (): Promise<
    VaultV2RotationJournal | undefined
  > => {
    if (activeVaultDatabase === undefined) return undefined;
    return activeVaultDatabase.metadata
      .get('vault')
      .then((metadata) => metadata?.pendingRotation);
  };

  const clearPendingVaultRotation = async (
    idempotencyKey: string,
  ): Promise<void> => {
    await databaseLock(async () => {
      if (activeVaultDatabase === undefined) return;
      const metadata = await activeVaultDatabase.metadata.get('vault');
      if (metadata?.pendingRotation?.idempotencyKey !== idempotencyKey) return;
      const { pendingRotation: _pendingRotation, ...withoutPendingRotation } =
        metadata;
      await activeVaultDatabase.metadata.put(withoutPendingRotation);
    });
  };

  const lock = (): void => {
    generation += 1;
    passkeyUnlockHandoff.clear();
    key = undefined;
    syncKey = undefined;
    signingKey = undefined;
    verifyKey = undefined;
    clearActiveVmk();
    activeVaultDatabase?.close();
    activeVaultDatabase = undefined;
    activeGeneration = -1;
    vaultContext = undefined;
    activeDatabase.close();
    session.setSnapshot({
      status: 'locked',
      error: undefined,
      warning: undefined,
    });
    channel.broadcast('session-locked');
  };

  const failClosed = (error: unknown): void => {
    generation += 1;
    passkeyUnlockHandoff.clear();
    key = undefined;
    syncKey = undefined;
    signingKey = undefined;
    verifyKey = undefined;
    clearActiveVmk();
    activeVaultDatabase?.close();
    activeVaultDatabase = undefined;
    activeGeneration = -1;
    vaultContext = undefined;
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
      generation += 1;
      key = undefined;
      syncKey = undefined;
      signingKey = undefined;
      verifyKey = undefined;
      clearActiveVmk();
      if (activeVaultDatabase !== undefined) {
        activeVaultDatabase.close();
        await activeVaultDatabase.delete();
        activeVaultDatabase = undefined;
        vaultContext = undefined;
        channel.broadcast('database-deleted');
        return;
      }
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
      if (activeVaultDatabase !== undefined && vaultContext !== undefined) {
        const vaultDatabase = activeVaultDatabase;
        const context = vaultContext;
        const encryptedWrites = await Promise.all(
          writes.map(async (write) => ({
            collection: write.collection,
            records: await Promise.all(
              write.records.map(async (record) => {
                const id = getPersistenceRecordId(record);
                const envelope = await vaultProtocol.encryptRecord(
                  JSON.stringify(record),
                  { ...context, collection: write.collection, recordId: id },
                  currentKey,
                );
                return {
                  id,
                  collection: write.collection,
                  header: envelope.header,
                  ciphertext: envelope.ciphertext,
                  updatedAt: Date.now(),
                };
              }),
            ),
          })),
        );
        if (generation !== activeGeneration)
          throw createPersistenceLockedError();
        await vaultDatabase.transaction(
          'rw',
          vaultDatabase.records,
          async () => {
            if (generation !== activeGeneration)
              throw createPersistenceLockedError();
            for (const write of encryptedWrites) {
              await vaultDatabase.records
                .where('collection')
                .equals(write.collection)
                .delete();
              await vaultDatabase.records.bulkPut(write.records);
            }
          },
        );
        persistenceSyncMetadata.markDirty();
        return;
      }
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
    if (activeVaultDatabase !== undefined && vaultContext !== undefined) {
      const primaryRepository = repository(
        primaryWrite.collection,
        primaryWrite.validator,
        primaryWrite.getId,
      );
      const result = await primaryRepository.putManyIfAbsentWithRelated(
        primaryWrite.records,
        primaryWrite.getDuplicateKey,
        createRelatedWrite,
      );
      if (result.written.length > 0) persistenceSyncMetadata.markDirty();
      return result;
    }
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

  const toRecordKey = (collection: string, id: string): [string, string] => [
    collection,
    id,
  ];

  return {
    setAccountContext,
    getSnapshot: session.getSnapshot,
    subscribe: session.subscribe,
    isUnlocked: () => key !== undefined,
    getGeneration: () => generation,
    requireKey,
    requireVaultSyncMaterial: () => {
      if (
        syncKey === undefined ||
        signingKey === undefined ||
        verifyKey === undefined ||
        vaultContext === undefined
      )
        throw createPersistenceLockedError();
      return { syncKey, signingKey, verifyKey, context: vaultContext };
    },
    getVaultTransferMaterial,
    readVaultLocalShare,
    removeVaultLocalShare,
    storeVaultLocalShare,
    repository,
    requestPersistentStorage,
    unlock,
    unlockWithVaultKeys,
    rotateVaultKeys,
    verifyVaultVmk,
    getPendingVaultRotation,
    clearPendingVaultRotation,
    lock,
    failClosed,
    clearLocalData,
    replaceCollections,
    putManyIfAbsentWithRelated,
    deleteMatchingRecords: async (deletions) => {
      if (activeVaultDatabase !== undefined && vaultContext !== undefined) {
        const vaultDatabase = activeVaultDatabase;
        const context = vaultContext;
        await databaseLock(async () => {
          const keysToDelete: Array<[string, string]> = (
            await Promise.all(
              deletions.map(async (deletion) => {
                const envelopes = await vaultDatabase.records
                  .where('collection')
                  .equals(deletion.collection)
                  .toArray();
                const records = await Promise.all(
                  envelopes.map(async (envelope) => {
                    const plaintext = await vaultProtocol.decryptRecord(
                      {
                        header: envelope.header,
                        ciphertext: envelope.ciphertext,
                      },
                      {
                        ...context,
                        collection: deletion.collection,
                        recordId: envelope.id,
                      },
                      requireKey(),
                    );
                    const parsed: unknown = JSON.parse(plaintext);
                    if (!deletion.validator(parsed))
                      throw new Error('Vault record validation failed');
                    return { id: envelope.id, value: parsed };
                  }),
                );
                return records
                  .filter((record) => deletion.shouldDelete(record.value))
                  .map((record) => toRecordKey(deletion.collection, record.id));
              }),
            )
          ).flat();
          if (generation !== activeGeneration)
            throw createPersistenceLockedError();
          await vaultDatabase.transaction(
            'rw',
            vaultDatabase.records,
            async () => {
              if (generation !== activeGeneration)
                throw createPersistenceLockedError();
              await vaultDatabase.records.bulkDelete(keysToDelete);
            },
          );
        });
        persistenceSyncMetadata.markDirty();
        return;
      }
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
