import type {
  EncryptedCollectionWrite,
  EncryptedCollectionWriteIfAbsent,
  EncryptedRecordDeletion,
  EncryptedRelatedWrite,
  EncryptedRepository,
  EncryptedWriteResult,
  PersistenceCollection,
} from '#shared/adapters/persistence/ports';

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
  readonly requireKey: () => CryptoKey;
  readonly repository: <TRecord extends object>(
    collection: PersistenceCollection,
    validator: (value: unknown) => value is TRecord,
    getId: (record: TRecord) => string,
  ) => EncryptedRepository<TRecord>;
  readonly requestPersistentStorage: () => Promise<PersistentStorageStatus>;
  readonly unlock: (
    passphrase: string,
    hydrate?: () => Promise<void>,
  ) => Promise<void>;
  readonly lock: () => void;
  readonly failClosed: (error: unknown) => void;
  readonly clearLocalData: (options?: {
    readonly removePreferences?: boolean;
  }) => Promise<void>;
  readonly replaceCollections: (
    writes: ReadonlyArray<EncryptedCollectionWrite>,
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
