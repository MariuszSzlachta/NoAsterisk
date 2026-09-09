import type { PersistenceSyncMetadataService } from '#shared/adapters/persistence/sync-metadata/persistence-sync-metadata-service';
import type { PersistenceSyncMetadata } from '#shared/adapters/persistence/sync-metadata/sync-metadata-types';

const SYNC_METADATA_KEY = 'budget-sync-metadata';

const INITIAL_METADATA: PersistenceSyncMetadata = {
  observedRevision: undefined,
  lastSuccessfulSyncRevision: undefined,
  lastSuccessfulSyncAt: undefined,
  isDirty: false,
};
const listeners = new Set<() => void>();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const readMetadata = (): PersistenceSyncMetadata => {
  if (typeof localStorage === 'undefined') {
    return INITIAL_METADATA;
  }

  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(SYNC_METADATA_KEY) ?? 'null',
    );
    if (!isRecord(parsed)) {
      return INITIAL_METADATA;
    }

    const {
      observedRevision,
      lastSuccessfulSyncRevision,
      lastSuccessfulSyncAt,
      isDirty,
    } = parsed;
    return {
      observedRevision:
        typeof observedRevision === 'number' ? observedRevision : undefined,
      lastSuccessfulSyncRevision:
        typeof lastSuccessfulSyncRevision === 'number'
          ? lastSuccessfulSyncRevision
          : undefined,
      lastSuccessfulSyncAt:
        typeof lastSuccessfulSyncAt === 'string'
          ? lastSuccessfulSyncAt
          : undefined,
      isDirty: isDirty === true,
    };
  } catch {
    return INITIAL_METADATA;
  }
};

let cachedMetadata = readMetadata();

const writeMetadata = (metadata: PersistenceSyncMetadata): void => {
  cachedMetadata = metadata;
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(metadata));
  } catch {
    return;
  }
  listeners.forEach((listener) => listener());
};

const getPersistenceSyncMetadata = (): PersistenceSyncMetadata =>
  cachedMetadata;

const subscribePersistenceSyncMetadata = (
  listener: () => void,
): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const markPersistenceDirty = (): void => {
  writeMetadata({ ...cachedMetadata, isDirty: true });
};

const markPersistenceSynced = (revision: number, syncedAt: string): void => {
  writeMetadata({
    observedRevision: revision,
    lastSuccessfulSyncRevision: revision,
    lastSuccessfulSyncAt: syncedAt,
    isDirty: false,
  });
};

const rememberPersistenceRevision = (revision: number): void => {
  writeMetadata({ ...cachedMetadata, observedRevision: revision });
};

export const persistenceSyncMetadata: PersistenceSyncMetadataService = {
  get: getPersistenceSyncMetadata,
  subscribe: subscribePersistenceSyncMetadata,
  markDirty: markPersistenceDirty,
  markSynced: markPersistenceSynced,
  rememberRevision: rememberPersistenceRevision,
};
