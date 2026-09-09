import type { VaultSyncStatus } from '#features/user-settings/model/types/vault-sync-status';

export const STATUS_COLORS: Record<VaultSyncStatus, string> = {
  'up-to-date': 'border-income/30 bg-income/5',
  'local-changes': 'border-warning/30 bg-warning/5',
  'never-synced': 'border-border bg-surface-2',
  'remote-newer': 'border-warning/30 bg-warning/5',
  syncing: 'border-primary/30 bg-primary/5',
  conflict: 'border-expense/30 bg-expense/5',
  error: 'border-expense/30 bg-expense/5',
};
