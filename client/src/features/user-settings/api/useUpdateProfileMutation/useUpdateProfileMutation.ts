// ═══════════════════════════════════════════════════════════════════
// User Settings — Update Profile Mutation
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';

import { apiClient } from '#shared/api';

// ─── Types ───────────────────────────────────────────────────────

interface UpdateProfileBody {
  readonly displayName: string;
}

interface UpdateProfileResponse {
  readonly displayName: string;
}

interface MutationState {
  readonly isLoading: boolean;
  readonly error: string | undefined;
}

interface UseUpdateProfileMutationResult {
  readonly state: MutationState;
  readonly mutateAsync: (body: UpdateProfileBody) => Promise<boolean>;
  readonly reset: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useUpdateProfileMutation = (): UseUpdateProfileMutationResult => {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: undefined,
  });

  const mutateAsync = async (body: UpdateProfileBody): Promise<boolean> => {
    setState({ isLoading: true, error: undefined });

    try {
      await apiClient.patch<UpdateProfileResponse, UpdateProfileBody>('/users/me', body);
      setState({ isLoading: false, error: undefined });
      return true;
    } catch {
      setState({ isLoading: false, error: 'Nie udało się zaktualizować profilu' });
      return false;
    }
  };

  const reset = (): void => {
    setState({ isLoading: false, error: undefined });
  };

  return { state, mutateAsync, reset };
};
