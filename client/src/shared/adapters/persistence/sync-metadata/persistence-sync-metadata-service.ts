import type { PersistenceSyncMetadata } from '#shared/adapters/persistence/sync-metadata/sync-metadata-types';

export interface PersistenceSyncMetadataService {
  readonly setNamespace: (namespace: string) => void;
  readonly get: () => PersistenceSyncMetadata;
  readonly subscribe: (listener: () => void) => () => void;
  readonly markDirty: () => void;
  readonly markSynced: (revision: number, syncedAt: string, envelopeHash?: string, coveredMutationVersion?: number) => void;
  readonly rememberRevision: (revision: number, envelopeHash?: string) => void;
  readonly resetForRotation: () => void;
}
