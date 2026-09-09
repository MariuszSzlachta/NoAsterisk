import type { VaultSyncStatus } from '#features/user-settings/model/types/vault-sync-status';

export const STATUS_I18N: Record<VaultSyncStatus, string> = {
  'up-to-date': 'settings.vault.statusUpToDate',
  'local-changes': 'settings.vault.statusLocalChanges',
  'never-synced': 'settings.vault.statusNeverSynced',
  'remote-newer': 'settings.vault.statusRemoteNewer',
  syncing: 'settings.vault.statusSyncing',
  conflict: 'settings.vault.statusConflict',
  error: 'settings.vault.statusError',
};
