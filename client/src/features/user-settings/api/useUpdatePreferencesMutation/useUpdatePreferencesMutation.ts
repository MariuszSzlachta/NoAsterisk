import { USERS_ME_PREFERENCES_PATH } from '#features/user-settings/api/constants/users-me-preferences-path';
import type { MutationState } from '#features/user-settings/api/useUpdatePreferencesMutation/mutation-state';
import type { UseUpdatePreferencesMutationResult } from '#features/user-settings/api/useUpdatePreferencesMutation/use-update-preferences-mutation-result';

import { useState } from 'react';

import type { PreferencesValues } from '#features/user-settings/model/types/preferences-values';
import { apiClient } from '#shared/api';

export const useUpdatePreferencesMutation = (): UseUpdatePreferencesMutationResult => {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: undefined,
  });

  const mutateAsync = async (body: Partial<PreferencesValues>): Promise<boolean> => {
    setState({ isLoading: true, error: undefined });

    try {
      await apiClient.patch<PreferencesValues, Partial<PreferencesValues>>(
        USERS_ME_PREFERENCES_PATH,
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
