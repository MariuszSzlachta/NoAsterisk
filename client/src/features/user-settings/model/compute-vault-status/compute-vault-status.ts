import type { VaultSyncStatus } from '#features/user-settings/model/types/vault-sync-status';

export const computeVaultStatus = (
  hasRemoteSnapshot: boolean,
  isDirty: boolean,
  lastSuccessfulSyncRevision: number | undefined,
  remoteRevision: number | undefined,
): VaultSyncStatus => {
  if (!hasRemoteSnapshot) {
    return isDirty ? 'local-changes' : 'never-synced';
  }
  if (isDirty) {
    return 'local-changes';
  }
  const hasRemoteChanges =
    lastSuccessfulSyncRevision === undefined ||
    (remoteRevision !== undefined &&
      lastSuccessfulSyncRevision !== remoteRevision);
  if (hasRemoteChanges) {
    return 'remote-newer';
  }
  return 'up-to-date';
};
