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

const isValidRevision = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

const isValidEnvelopeHash = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

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
    const safeObservedRevision = isValidRevision(observedRevision)
      ? observedRevision
      : undefined;
    const safeLastSuccessfulSyncRevision =
      isValidRevision(lastSuccessfulSyncRevision) &&
      safeObservedRevision !== undefined &&
      lastSuccessfulSyncRevision <= safeObservedRevision
        ? lastSuccessfulSyncRevision
        : undefined;
    return {
      observedRevision: safeObservedRevision,
      lastSuccessfulSyncRevision: safeLastSuccessfulSyncRevision,
      lastSuccessfulSyncAt:
        safeLastSuccessfulSyncRevision !== undefined &&
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
      ...(isValidEnvelopeHash(highWaterEnvelopeHash)
        ? { highWaterEnvelopeHash }
        : {}),
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
  if (
    !isValidRevision(revision) ||
    (envelopeHash !== undefined && !isValidEnvelopeHash(envelopeHash))
  )
    return;
  if (
    cachedMetadata.observedRevision !== undefined &&
    revision < cachedMetadata.observedRevision
  ) {
    return;
  }
  if (
    cachedMetadata.observedRevision === revision &&
    cachedMetadata.highWaterEnvelopeHash !== undefined &&
    envelopeHash !== undefined &&
    cachedMetadata.highWaterEnvelopeHash !== envelopeHash
  ) {
    return;
  }
  if (
    envelopeHash === undefined &&
    cachedMetadata.observedRevision !== undefined &&
    revision > cachedMetadata.observedRevision
  ) {
    return;
  }
  const hasUncoveredMutations =
    coveredMutationVersion !== undefined &&
    cachedMetadata.mutationVersion !== coveredMutationVersion;
  writeMetadata({
    observedRevision: revision,
    lastSuccessfulSyncRevision: revision,
    lastSuccessfulSyncAt: syncedAt,
    isDirty: hasUncoveredMutations,
    mutationVersion: cachedMetadata.mutationVersion,
    ...(envelopeHash === undefined
      ? cachedMetadata.highWaterEnvelopeHash === undefined
        ? {}
        : { highWaterEnvelopeHash: cachedMetadata.highWaterEnvelopeHash }
      : { highWaterEnvelopeHash: envelopeHash }),
  });
};

const rememberPersistenceRevision = (
  revision: number,
  envelopeHash?: string,
): void => {
  if (
    !isValidRevision(revision) ||
    (envelopeHash !== undefined && !isValidEnvelopeHash(envelopeHash))
  )
    return;
  writeMetadata({
    ...cachedMetadata,
    observedRevision: revision,
    ...(envelopeHash === undefined
      ? {}
      : { highWaterEnvelopeHash: envelopeHash }),
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
