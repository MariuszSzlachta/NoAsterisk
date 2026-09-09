import type { VaultResponse } from '#features/user-settings/api/useVaultQuery/vault-response';

export interface UseVaultQueryResult {
  readonly data: VaultResponse | undefined;
  readonly isLoading: boolean;
  readonly error: unknown;
  readonly hasRemoteSnapshot: boolean;
  readonly refetch: () => Promise<void>;
}
