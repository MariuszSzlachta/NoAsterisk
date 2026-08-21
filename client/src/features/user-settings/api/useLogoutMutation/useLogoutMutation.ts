// ═══════════════════════════════════════════════════════════════════
// User Settings — Logout Mutation
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';

import { apiClient } from '#shared/api';
import { authTokens } from '#shared/api/auth-tokens';

// ─── Types ───────────────────────────────────────────────────────

interface MutationState {
  readonly isLoading: boolean;
  readonly error: string | undefined;
}

interface UseLogoutMutationResult {
  readonly state: MutationState;
  readonly mutateAsync: () => Promise<boolean>;
  readonly reset: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useLogoutMutation = (): UseLogoutMutationResult => {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: undefined,
  });

  const mutateAsync = async (): Promise<boolean> => {
    setState({ isLoading: true, error: undefined });

    try {
      await apiClient.post<Record<string, never>, Record<string, never>>(
        '/users/me/logout',
        {},
      );
    } catch {
      // Logout should succeed even if server call fails (client-side cleanup still happens)
    }

    // Always clear tokens regardless of server response
    authTokens.clear();
    setState({ isLoading: false, error: undefined });
    return true;
  };

  const reset = (): void => {
    setState({ isLoading: false, error: undefined });
  };

  return { state, mutateAsync, reset };
};
