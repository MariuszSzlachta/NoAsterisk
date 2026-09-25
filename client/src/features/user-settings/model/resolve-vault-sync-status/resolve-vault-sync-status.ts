import type { VaultSyncStatus } from '#features/user-settings/model/types/vault-sync-status';

interface VaultSyncStatusInput {
  readonly hasConflict: boolean;
  readonly hasRemoteError: boolean;
  readonly isSyncing: boolean;
  readonly isDirty: boolean;
  readonly observedRevision: number | undefined;
  readonly remoteRevision: number | undefined;
}

export const resolveVaultSyncStatus = ({
  hasConflict,
  hasRemoteError,
  isSyncing,
  isDirty,
  observedRevision,
  remoteRevision,
}: VaultSyncStatusInput): VaultSyncStatus => {
  if (hasConflict) return 'conflict';
  if (hasRemoteError) return 'error';
  if (isSyncing) return 'syncing';
  if (remoteRevision === undefined)
    return isDirty ? 'local-changes' : 'never-synced';
  if (isDirty && (observedRevision ?? 0) > remoteRevision)
    return 'local-changes';
  if (observedRevision !== undefined && remoteRevision > observedRevision)
    return 'remote-newer';
  return 'up-to-date';
};
