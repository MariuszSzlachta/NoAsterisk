import type { PersistenceSyncMetadataService } from '#shared/adapters/persistence/sync-metadata/persistence-sync-metadata-service';
import type { PersistenceSyncMetadata } from '#shared/adapters/persistence/sync-metadata/sync-metadata-types';

const SYNC_METADATA_KEY_PREFIX = 'budget-sync-metadata';

const INITIAL_METADATA: PersistenceSyncMetadata = {
  observedRevision: undefined,
  lastSuccessfulSyncRevision: undefined,
  lastSuccessfulSyncAt: undefined,
  isDirty: false,
  mutationVersion: 0,
};
const listeners = new Set<() => void>();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

let namespace = 'anonymous';

const getStorageKey = (): string => `${SYNC_METADATA_KEY_PREFIX}:${namespace}`;

const readMetadata = (): PersistenceSyncMetadata => {
  if (typeof localStorage === 'undefined') {
    return INITIAL_METADATA;
  }

  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(getStorageKey()) ?? 'null',
    );
    if (!isRecord(parsed)) {
      return INITIAL_METADATA;
    }

    const {
      observedRevision,
      lastSuccessfulSyncRevision,
      lastSuccessfulSyncAt,
      isDirty,
      highWaterEnvelopeHash,
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
      mutationVersion:
        typeof parsed.mutationVersion === 'number' &&
        Number.isSafeInteger(parsed.mutationVersion) &&
        parsed.mutationVersion >= 0
          ? parsed.mutationVersion
          : 0,
      ...(typeof highWaterEnvelopeHash === 'string' ? { highWaterEnvelopeHash } : {}),
    };
  } catch {
    return INITIAL_METADATA;
  }
};

let cachedMetadata = readMetadata();

const writeMetadata = (metadata: PersistenceSyncMetadata): void => {
  cachedMetadata = metadata;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(metadata));
    } catch {
      // The in-memory value and subscribers remain authoritative when storage
      // is unavailable or quota-limited.
    }
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
  writeMetadata({
    ...cachedMetadata,
    isDirty: true,
    mutationVersion: cachedMetadata.mutationVersion + 1,
  });
};

const markPersistenceSynced = (
  revision: number,
  syncedAt: string,
  envelopeHash?: string,
  coveredMutationVersion?: number,
): void => {
  const hasUncoveredMutations =
    coveredMutationVersion !== undefined &&
    cachedMetadata.mutationVersion !== coveredMutationVersion;
  writeMetadata({
    observedRevision: revision,
    lastSuccessfulSyncRevision: revision,
    lastSuccessfulSyncAt: syncedAt,
    isDirty: hasUncoveredMutations,
    mutationVersion: cachedMetadata.mutationVersion,
    ...(envelopeHash === undefined ? {} : { highWaterEnvelopeHash: envelopeHash }),
  });
};

const rememberPersistenceRevision = (revision: number, envelopeHash?: string): void => {
  writeMetadata({
    ...cachedMetadata,
    observedRevision: revision,
    ...(envelopeHash === undefined ? {} : { highWaterEnvelopeHash: envelopeHash }),
  });
};

const resetPersistenceForRotation = (): void => {
  writeMetadata({
    observedRevision: undefined,
    lastSuccessfulSyncRevision: undefined,
    lastSuccessfulSyncAt: undefined,
    isDirty: true,
    mutationVersion: cachedMetadata.mutationVersion + 1,
  });
};

export const persistenceSyncMetadata: PersistenceSyncMetadataService = {
  setNamespace: (nextNamespace: string): void => {
    namespace = nextNamespace;
    cachedMetadata = readMetadata();
    listeners.forEach((listener) => listener());
  },
  get: getPersistenceSyncMetadata,
  subscribe: subscribePersistenceSyncMetadata,
  markDirty: markPersistenceDirty,
  markSynced: markPersistenceSynced,
  rememberRevision: rememberPersistenceRevision,
  resetForRotation: resetPersistenceForRotation,
};
