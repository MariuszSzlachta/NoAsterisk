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
import { clearVaultRotationJournal } from '#shared/adapters/persistence/dexie/clear-vault-rotation-journal';
import { confirmVaultRotationBackup } from '#shared/adapters/persistence/dexie/confirm-vault-rotation-backup';
import { renewVaultRotationJournal } from '#shared/adapters/persistence/dexie/renewVaultRotationJournal';
import { migrateLegacyLocalStorage } from '#shared/adapters/persistence/migrations';
import type {
  EncryptedCollectionWrite,
  EncryptedCollectionWriteIfAbsent,
  EncryptedRelatedWrite,
  EncryptedRepository,
  EncryptedWriteResult,
  PersistenceCollection,
} from '#shared/adapters/persistence/ports';
import type { CollectionReplacementPublication } from '#shared/adapters/persistence/ports/collection-replacement-publication';
import { createVaultLocalShareStore } from '#shared/adapters/persistence/session/create-vault-local-share-store';
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
import type { RotationTranscriptSnapshot } from '#shared/adapters/vault-protocol/rotation-transcript';
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
  const vaultLocalShareStore = createVaultLocalShareStore();
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
    const resolve = (): EncryptedRepository<TRecord> => {
      if (activeVaultDatabase !== undefined && vaultContext !== undefined) {
        const repositoryDatabase = activeVaultDatabase;
        const repositoryContext = vaultContext;
        const repositoryGeneration = activeGeneration;
        return createVaultV2Repository(
          repositoryDatabase,
          collection,
          requireKey,
          validator,
          getId,
          repositoryContext,
          databaseLock,
          () =>
            generation === repositoryGeneration &&
            activeGeneration === repositoryGeneration &&
            activeVaultDatabase === repositoryDatabase &&
            vaultContext === repositoryContext,
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

    return {
      get: (id) => resolve().get(id),
      getAll: () => resolve().getAll(),
      put: (record) => resolve().put(record),
      putMany: (records) => resolve().putMany(records),
      putManyIfAbsent: (records, getDuplicateKey) =>
        resolve().putManyIfAbsent(records, getDuplicateKey),
      putManyIfAbsentWithRelated: <TRelated extends object>(
        records: ReadonlyArray<TRecord>,
        getDuplicateKey: (record: TRecord) => string,
        createRelatedWrite: (
          result: EncryptedWriteResult<TRecord>,
        ) => EncryptedRelatedWrite<TRelated>,
      ) =>
        resolve().putManyIfAbsentWithRelated(
          records,
          getDuplicateKey,
          createRelatedWrite,
        ),
      replace: (records) => resolve().replace(records),
      delete: (id) => resolve().delete(id),
      clear: () => resolve().clear(),
    };
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
      readonly requiresRemoteRestore?: boolean;
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
          effectiveVaultKeys.signingKeyPair ??
          existingMetadata?.signingKeyPair ??
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
            requiresRemoteRestore: vaultKeys.requiresRemoteRestore ?? true,
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
            deviceId: effectiveContext.deviceId,
            requiresRemoteRestore:
              vaultKeys.requiresRemoteRestore ??
              existingMetadata.requiresRemoteRestore,
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
      readonly transcript?: RotationTranscriptSnapshot;
      readonly envelopePurpose: 'device-wrap' | 'passkey-wrap';
      readonly envelope: string;
      readonly passkeyEnvelope?: string;
      readonly nextVmk: Uint8Array;
      readonly recoveryBackupConfirmed: true;
    },
  ): Promise<void> => {
    const requestedGeneration = generation;
    await databaseLock(async () => {
      if (
        generation !== requestedGeneration ||
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
    const requestedGeneration = generation;
    await databaseLock(async () => {
      if (
        generation !== requestedGeneration ||
        activeVaultDatabase === undefined
      )
        throw createPersistenceLockedError();
      const metadata = await activeVaultDatabase.metadata.get('vault');
      if (generation !== requestedGeneration)
        throw createPersistenceLockedError();
      if (metadata === undefined)
        throw createPersistenceCryptoError('Vault metadata is missing');
      const keys = await vaultProtocol.deriveKeys(vmk, context);
      if (generation !== requestedGeneration)
        throw createPersistenceLockedError();
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
        if (generation !== requestedGeneration)
          throw createPersistenceLockedError();
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
        !parsed.every(
          (value): value is number =>
            typeof value === 'number' &&
            Number.isInteger(value) &&
            value >= 0 &&
            value <= 255,
        )
      )
        throw createPersistenceCryptoError(
          'Vault recovery does not match active key',
        );
      const nextVmk = new Uint8Array(parsed);
      try {
        const nextContext = { ...context, keyId: metadata.keyId };
        const nextKeys = await vaultProtocol.deriveKeys(nextVmk, nextContext);
        if (generation !== requestedGeneration)
          throw createPersistenceLockedError();
        await vaultProtocol.verifySentinel(
          metadata.sentinel,
          nextContext,
          nextKeys.check,
        );
        if (generation !== requestedGeneration)
          throw createPersistenceLockedError();
      } finally {
        nextVmk.fill(0);
      }
    });
  };

  const getPendingVaultRotation = async (): Promise<
    VaultV2RotationJournal | undefined
  > => {
    const database = activeVaultDatabase;
    const requestedGeneration = generation;
    if (database === undefined) return undefined;
    const metadata = await database.metadata.get('vault');
    if (generation !== requestedGeneration || activeVaultDatabase !== database)
      throw createPersistenceLockedError();
    return metadata?.pendingRotation;
  };

  const renewPendingVaultRotation = async (
    previousChallenge: string,
    transcript: RotationTranscriptSnapshot,
  ): Promise<void> => {
    const requestedGeneration = generation;
    const database = activeVaultDatabase;
    const context = vaultContext;
    await databaseLock(async () => {
      if (database === undefined || context === undefined)
        throw createPersistenceLockedError();
      await renewVaultRotationJournal(
        database,
        previousChallenge,
        transcript,
        () => {
          if (
            generation !== requestedGeneration ||
            activeVaultDatabase !== database ||
            vaultContext !== context
          )
            throw createPersistenceLockedError();
        },
      );
    });
  };

  const clearPendingVaultRotation = async (
    idempotencyKey: string,
  ): Promise<void> => {
    const requestedGeneration = generation;
    const database = activeVaultDatabase;
    const context = vaultContext;
    await databaseLock(async () => {
      if (
        database === undefined ||
        context === undefined ||
        generation !== requestedGeneration ||
        activeVaultDatabase !== database ||
        vaultContext !== context
      )
        throw createPersistenceLockedError();
      await clearVaultRotationJournal(database, idempotencyKey, () => {
        if (
          generation !== requestedGeneration ||
          activeVaultDatabase !== database ||
          vaultContext !== context
        )
          throw createPersistenceLockedError();
      });
    });
  };

  const confirmPendingVaultRotationBackup = async (
    idempotencyKey: string,
  ): Promise<void> => {
    const requestedGeneration = generation;
    const database = activeVaultDatabase;
    const context = vaultContext;
    await databaseLock(async () => {
      if (
        database === undefined ||
        context === undefined ||
        generation !== requestedGeneration ||
        activeVaultDatabase !== database ||
        vaultContext !== context
      )
        throw createPersistenceLockedError();
      await confirmVaultRotationBackup(
        database,
        idempotencyKey,
        context.keyId,
        () => {
          if (
            generation !== requestedGeneration ||
            activeVaultDatabase !== database ||
            vaultContext !== context
          )
            throw createPersistenceLockedError();
        },
      );
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
    publication?: CollectionReplacementPublication,
  ): Promise<void> => {
    const requestedGeneration = generation;
    await databaseLock(async () => {
      if (generation !== requestedGeneration)
        throw createPersistenceLockedError();
      publication?.assertCurrent();
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
        if (generation !== requestedGeneration)
          throw createPersistenceLockedError();
        publication?.assertCurrent();
        await vaultDatabase.transaction(
          'rw',
          vaultDatabase.records,
          async () => {
            if (generation !== requestedGeneration)
              throw createPersistenceLockedError();
            publication?.assertCurrent();
            for (const write of encryptedWrites) {
              await vaultDatabase.records
                .where('collection')
                .equals(write.collection)
                .delete();
              await vaultDatabase.records.bulkPut(write.records);
              if (generation !== requestedGeneration)
                throw createPersistenceLockedError();
              publication?.assertCurrent();
            }
          },
        );
        if (generation !== requestedGeneration)
          throw createPersistenceLockedError();
        try {
          publication?.assertCurrent();
        } catch (error) {
          // The IDB transaction committed. Never leave that replacement clean
          // merely because publication was superseded by an optimistic edit.
          persistenceSyncMetadata.markDirty();
          throw error;
        }
        persistenceSyncMetadata.markDirty();
        if (generation !== requestedGeneration)
          throw createPersistenceLockedError();
        publication?.publish(persistenceSyncMetadata.get().mutationVersion);
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

      if (generation !== requestedGeneration)
        throw createPersistenceLockedError();
      publication?.assertCurrent();
      await activeDatabase.transaction(
        'rw',
        activeDatabase.records,
        async () => {
          await encryptedWrites.reduce(async (previous, write) => {
            await previous;
            if (generation !== requestedGeneration)
              throw createPersistenceLockedError();
            publication?.assertCurrent();
            await activeDatabase.records
              .where('collection')
              .equals(write.collection)
              .delete();
            await activeDatabase.records.bulkPut(write.records);
            if (generation !== requestedGeneration)
              throw createPersistenceLockedError();
            publication?.assertCurrent();
          }, Promise.resolve());
        },
      );
      if (generation !== requestedGeneration)
        throw createPersistenceLockedError();
      try {
        publication?.assertCurrent();
      } catch (error) {
        persistenceSyncMetadata.markDirty();
        throw error;
      }
      persistenceSyncMetadata.markDirty();
      if (generation !== requestedGeneration)
        throw createPersistenceLockedError();
      publication?.publish(persistenceSyncMetadata.get().mutationVersion);
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
    readVaultLocalShare: vaultLocalShareStore.read,
    removeVaultLocalShare: vaultLocalShareStore.remove,
    storeVaultLocalShare: vaultLocalShareStore.store,
    repository,
    requestPersistentStorage,
    unlock,
    unlockWithVaultKeys,
    rotateVaultKeys,
    verifyVaultVmk,
    getPendingVaultRotation,
    clearPendingVaultRotation,
    renewPendingVaultRotation,
    confirmPendingVaultRotationBackup,
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
