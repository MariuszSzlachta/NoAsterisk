import type { PersistenceSyncMetadata } from '#shared/adapters/persistence/sync-metadata/sync-metadata-types';

export interface PersistenceSyncMetadataService {
  readonly get: () => PersistenceSyncMetadata;
  readonly subscribe: (listener: () => void) => () => void;
  readonly markDirty: () => void;
  readonly markSynced: (revision: number, syncedAt: string) => void;
  readonly rememberRevision: (revision: number) => void;
}
