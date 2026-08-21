// ═══════════════════════════════════════════════════════════════════
// User Settings — Upload Vault Mutation
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';

import { apiClient } from '#shared/api';

// ─── Types ───────────────────────────────────────────────────────

interface UploadVaultBody {
  readonly encryptedBlob: string;
}

interface UploadVaultResponse {
  readonly updatedAt: string;
}

interface MutationState {
  readonly isLoading: boolean;
  readonly error: string | undefined;
}

// Returns full response (not boolean) because caller needs updatedAt for vault status display
interface UseUploadVaultMutationResult {
  readonly state: MutationState;
  readonly mutateAsync: (body: UploadVaultBody) => Promise<UploadVaultResponse | undefined>;
  readonly reset: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useUploadVaultMutation = (): UseUploadVaultMutationResult => {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: undefined,
  });

  const mutateAsync = async (body: UploadVaultBody): Promise<UploadVaultResponse | undefined> => {
    setState({ isLoading: true, error: undefined });

    try {
      const response = await apiClient.put<UploadVaultResponse, UploadVaultBody>(
        '/users/me/vault',
        body,
      );
      setState({ isLoading: false, error: undefined });
      return response;
    } catch {
      setState({ isLoading: false, error: 'Nie udało się przesłać kopii zapasowej' });
      return undefined;
    }
  };

  const reset = (): void => {
    setState({ isLoading: false, error: undefined });
  };

  return { state, mutateAsync, reset };
};
