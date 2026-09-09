export type VaultSyncStatus =
  | 'up-to-date'
  | 'local-changes'
  | 'never-synced'
  | 'remote-newer'
  | 'syncing'
  | 'conflict'
  | 'error';
