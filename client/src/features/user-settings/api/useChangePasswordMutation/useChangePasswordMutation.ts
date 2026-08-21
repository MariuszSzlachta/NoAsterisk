// ═══════════════════════════════════════════════════════════════════
// User Settings — Change Password Mutation
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';

import { ApiError, apiClient } from '#shared/api';

// ─── Types ───────────────────────────────────────────────────────

interface ChangePasswordBody {
  readonly currentPassword: string;
  readonly newPassword: string;
}

interface ChangePasswordResponse {
  readonly success: boolean;
}

interface MutationState {
  readonly isLoading: boolean;
  readonly error: string | undefined;
}

interface UseChangePasswordMutationResult {
  readonly state: MutationState;
  readonly mutateAsync: (body: ChangePasswordBody) => Promise<boolean>;
  readonly reset: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useChangePasswordMutation = (): UseChangePasswordMutationResult => {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: undefined,
  });

  const mutateAsync = async (body: ChangePasswordBody): Promise<boolean> => {
    setState({ isLoading: true, error: undefined });

    try {
      await apiClient.post<ChangePasswordResponse, ChangePasswordBody>(
        '/users/me/change-password',
        body,
      );
      setState({ isLoading: false, error: undefined });
      return true;
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 401
          ? 'Nieprawidłowe obecne hasło'
          : 'Nie udało się zmienić hasła';
      setState({ isLoading: false, error: message });
      return false;
    }
  };

  const reset = (): void => {
    setState({ isLoading: false, error: undefined });
  };

  return { state, mutateAsync, reset };
};
