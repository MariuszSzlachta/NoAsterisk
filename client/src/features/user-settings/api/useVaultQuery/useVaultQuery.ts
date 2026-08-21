// ═══════════════════════════════════════════════════════════════════
// User Settings — Vault Query
// ═══════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useState } from 'react';

import { ApiError, apiClient } from '#shared/api';

// ─── Types ───────────────────────────────────────────────────────

interface VaultResponse {
  readonly encryptedBlob: string;
  readonly updatedAt: string;
}

interface UseVaultQueryResult {
  readonly data: VaultResponse | undefined;
  readonly isLoading: boolean;
  readonly error: string | undefined;
  readonly hasBackup: boolean;
  readonly refetch: () => Promise<void>;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useVaultQuery = (): UseVaultQueryResult => {
  const [data, setData] = useState<VaultResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const fetchVault = useCallback(async (signal?: AbortSignal): Promise<void> => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await apiClient.get<VaultResponse>('/users/me/vault', { signal });
      setData(response);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      if (err instanceof ApiError && err.status === 404) {
        setData(undefined);
      } else {
        setError('Nie udało się sprawdzić stanu kopii zapasowej');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchVault(controller.signal);
    return () => { controller.abort(); };
  }, [fetchVault]);

  return {
    data,
    isLoading,
    error,
    hasBackup: data !== undefined,
    refetch: fetchVault,
  };
};
