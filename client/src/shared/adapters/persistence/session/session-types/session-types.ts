import type { VaultV2RotationJournal } from '#shared/adapters/persistence/dexie';
import type {
  EncryptedCollectionWrite,
  EncryptedCollectionWriteIfAbsent,
  EncryptedRecordDeletion,
  EncryptedRelatedWrite,
  EncryptedRepository,
  EncryptedWriteResult,
  PersistenceCollection,
} from '#shared/adapters/persistence/ports';
import type { CollectionReplacementPublication } from '#shared/adapters/persistence/ports/collection-replacement-publication';

type PersistenceSessionStatus = 'locked' | 'unlocking' | 'unlocked' | 'error';
type PersistentStorageStatus = 'unknown' | 'granted' | 'denied' | 'unavailable';

interface PersistenceSessionSnapshot {
  readonly status: PersistenceSessionStatus;
  readonly error: string | undefined;
  readonly warning: string | undefined;
  readonly storage: PersistentStorageStatus;
}

interface EncryptedPersistence {
  readonly setAccountContext: (userId: string, workspaceId: string) => void;
  readonly getSnapshot: () => PersistenceSessionSnapshot;
  readonly subscribe: (listener: () => void) => () => void;
  readonly isUnlocked: () => boolean;
  readonly getGeneration: () => number;
  readonly requireKey: () => CryptoKey;
  readonly requireVaultSyncMaterial: () => {
    readonly syncKey: CryptoKey;
    readonly signingKey: CryptoKey;
    readonly verifyKey: CryptoKey;
    readonly context: {
      readonly accountId: string;
      readonly workspaceId: string;
      readonly vaultId: string;
      readonly keyId: string;
      readonly deviceId: string;
    };
  };
  readonly getVaultTransferMaterial: (context: {
    readonly accountId: string;
    readonly workspaceId: string;
    readonly vaultId: string;
    readonly keyId: string;
    readonly deviceId: string;
  }) => {
    readonly vmk: Uint8Array;
    readonly signingKey: CryptoKey;
    readonly signingPublicKey: CryptoKey;
  };
  readonly readVaultLocalShare: (context: {
    readonly accountId: string;
    readonly workspaceId: string;
    readonly vaultId: string;
    readonly keyId: string;
    readonly deviceId: string;
  }) => Promise<CryptoKey | undefined>;
  readonly removeVaultLocalShare: (context: {
    readonly accountId: string;
    readonly workspaceId: string;
    readonly vaultId: string;
    readonly keyId: string;
    readonly deviceId: string;
  }) => Promise<void>;
  readonly storeVaultLocalShare: (
    context: {
      readonly accountId: string;
      readonly workspaceId: string;
      readonly vaultId: string;
      readonly keyId: string;
      readonly deviceId: string;
    },
    localShare: CryptoKey,
  ) => Promise<void>;
  readonly repository: <TRecord extends object>(
    collection: Exclude<PersistenceCollection, 'sentinel'>,
    validator: (value: unknown) => value is TRecord,
    getId: (record: TRecord) => string,
  ) => EncryptedRepository<TRecord>;
  readonly requestPersistentStorage: () => Promise<PersistentStorageStatus>;
  /** Legacy-only compatibility path; v2 accounts must use unlockWithVaultKeys. */
  readonly unlock: (
    passphrase: string,
    hydrate?: () => Promise<void>,
  ) => Promise<void>;
  readonly unlockWithVaultKeys: (
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
  ) => Promise<void>;
  readonly rotateVaultKeys: (
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
      readonly nextVmk: Uint8Array;
      readonly recoveryBackupConfirmed: true;
    },
  ) => Promise<void>;
  readonly verifyVaultVmk: (
    vmk: Uint8Array,
    context: {
      readonly accountId: string;
      readonly workspaceId: string;
      readonly vaultId: string;
      readonly keyId: string;
      readonly deviceId: string;
    },
  ) => Promise<void>;
  readonly getPendingVaultRotation: () => Promise<
    VaultV2RotationJournal | undefined
  >;
  readonly clearPendingVaultRotation: (idempotencyKey: string) => Promise<void>;
  readonly lock: () => void;
  readonly failClosed: (error: unknown) => void;
  readonly clearLocalData: (options?: {
    readonly removePreferences?: boolean;
  }) => Promise<void>;
  readonly replaceCollections: (
    writes: ReadonlyArray<EncryptedCollectionWrite>,
    publication?: CollectionReplacementPublication,
  ) => Promise<void>;
  readonly confirmPendingVaultRotationBackup: (
    idempotencyKey: string,
  ) => Promise<void>;
  readonly putManyIfAbsentWithRelated: <
    TRecord extends object,
    TRelated extends object,
  >(
    primaryWrite: EncryptedCollectionWriteIfAbsent<TRecord>,
    createRelatedWrite: (
      result: EncryptedWriteResult<TRecord>,
    ) => EncryptedRelatedWrite<TRelated>,
  ) => Promise<EncryptedWriteResult<TRecord>>;
  readonly deleteMatchingRecords: (
    deletions: ReadonlyArray<EncryptedRecordDeletion>,
  ) => Promise<void>;
}

const INITIAL_PERSISTENCE_SNAPSHOT: PersistenceSessionSnapshot = {
  status: 'locked',
  error: undefined,
  warning: undefined,
  storage: 'unknown',
};

export {
  INITIAL_PERSISTENCE_SNAPSHOT,
  type EncryptedPersistence,
  type PersistentStorageStatus,
  type PersistenceSessionSnapshot,
  type PersistenceSessionStatus,
};
