import { useCallback, useEffect, useState } from 'react';

import { USERS_ME_VAULT_PATH } from '#features/user-settings/api/constants/users-me-vault-path';
import type { UseVaultQueryResult } from '#features/user-settings/api/useVaultQuery/use-vault-query-result';
import type { VaultResponse } from '#features/user-settings/api/useVaultQuery/vault-response';
import { persistenceSyncMetadata } from '#shared/adapters/persistence';
import { apiClient, ApiError } from '#shared/api';

export const useVaultQuery = (): UseVaultQueryResult => {
  const [data, setData] = useState<VaultResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(undefined);

  const fetchVault = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      setIsLoading(true);
      setError(undefined);

      try {
        const response = await apiClient.get<VaultResponse>(
          USERS_ME_VAULT_PATH,
          { signal },
        );
        setData(response);
        persistenceSyncMetadata.rememberRevision(
          response.status === 'available' ? response.revision : 0,
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          setData(undefined);
          return;
        }
        setError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchVault(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchVault]);

  return {
    data,
    isLoading,
    error,
    hasRemoteSnapshot: data?.status === 'available',
    refetch: fetchVault,
  };
};
