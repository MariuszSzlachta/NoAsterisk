import type { VaultSyncStatus } from '#features/user-settings/model/types/vault-sync-status';

export const STATUS_I18N: Record<VaultSyncStatus, string> = {
  synced: 'settings.vault.statusSynced',
  unsynced: 'settings.vault.statusUnsynced',
  'no-backup': 'settings.vault.statusNoBackup',
};
