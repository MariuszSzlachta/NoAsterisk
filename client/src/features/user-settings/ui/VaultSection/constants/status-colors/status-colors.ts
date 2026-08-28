import type { VaultSyncStatus } from '#features/user-settings/model/types/vault-sync-status';

export const STATUS_COLORS: Record<VaultSyncStatus, string> = {
  synced: 'border-income/30 bg-income/5',
  unsynced: 'border-warning/30 bg-warning/5',
  'no-backup': 'border-expense/30 bg-expense/5',
};
