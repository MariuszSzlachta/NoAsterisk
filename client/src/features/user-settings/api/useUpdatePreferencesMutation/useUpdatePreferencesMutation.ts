// ═══════════════════════════════════════════════════════════════════
// User Settings — Update Preferences Mutation
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';

import type { PreferencesValues } from '#features/user-settings/model/types';
import { apiClient } from '#shared/api';

// ─── Types ───────────────────────────────────────────────────────

interface MutationState {
  readonly isLoading: boolean;
  readonly error: string | undefined;
}

interface UseUpdatePreferencesMutationResult {
  readonly state: MutationState;
  readonly mutateAsync: (body: Partial<PreferencesValues>) => Promise<boolean>;
  readonly reset: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useUpdatePreferencesMutation = (): UseUpdatePreferencesMutationResult => {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: undefined,
  });

  const mutateAsync = async (body: Partial<PreferencesValues>): Promise<boolean> => {
    setState({ isLoading: true, error: undefined });

    try {
      await apiClient.patch<PreferencesValues, Partial<PreferencesValues>>(
        '/users/me/preferences',
        body,
      );
      setState({ isLoading: false, error: undefined });
      return true;
    } catch {
      setState({ isLoading: false, error: 'Nie udało się zapisać preferencji' });
      return false;
    }
  };

  const reset = (): void => {
    setState({ isLoading: false, error: undefined });
  };

  return { state, mutateAsync, reset };
};
