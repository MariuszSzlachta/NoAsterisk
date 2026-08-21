// ═══════════════════════════════════════════════════════════════════
// User Settings — Delete Account Mutation
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';

import { ApiError, apiClient } from '#shared/api';

// ─── Types ───────────────────────────────────────────────────────

interface DeleteAccountBody {
  readonly password: string;
}

interface MutationState {
  readonly isLoading: boolean;
  readonly error: string | undefined;
}

interface UseDeleteAccountMutationResult {
  readonly state: MutationState;
  readonly mutateAsync: (body: DeleteAccountBody) => Promise<boolean>;
  readonly reset: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useDeleteAccountMutation = (): UseDeleteAccountMutationResult => {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: undefined,
  });

  const mutateAsync = async (body: DeleteAccountBody): Promise<boolean> => {
    setState({ isLoading: true, error: undefined });

    try {
      // Uses POST because HttpClient.delete() does not accept a body.
      // Backend endpoint: POST /users/me/delete (requires password confirmation)
      await apiClient.post<Record<string, never>, DeleteAccountBody>(
        '/users/me/delete',
        body,
      );
      setState({ isLoading: false, error: undefined });
      return true;
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 401
          ? 'Nieprawidłowe hasło'
          : 'Nie udało się usunąć konta';
      setState({ isLoading: false, error: message });
      return false;
    }
  };

  const reset = (): void => {
    setState({ isLoading: false, error: undefined });
  };

  return { state, mutateAsync, reset };
};
