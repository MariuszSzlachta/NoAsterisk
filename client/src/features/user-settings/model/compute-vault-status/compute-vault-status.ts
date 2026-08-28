import type { VaultSyncStatus } from '#features/user-settings/model/types/vault-sync-status';

export const computeVaultStatus = (
  hasBackup: boolean,
  lastSync: string | undefined,
): VaultSyncStatus => {
  if (!hasBackup) {
    return 'no-backup';
  }

  if (lastSync !== undefined) {
    return 'synced';
  }

  return 'unsynced';
};
