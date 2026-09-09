import type { VaultSyncStatus } from '#features/user-settings/model/types/vault-sync-status';

export interface VaultInfo {
  readonly status: VaultSyncStatus;
  readonly lastSync: string | undefined;
  readonly remoteRevision: number | undefined;
}
