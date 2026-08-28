import { USERS_ME_PATH } from '#features/user-settings/api/constants/users-me-path';
import type { MutationState } from '#features/user-settings/api/useUpdateProfileMutation/mutation-state';
import type { UpdateProfileBody } from '#features/user-settings/api/useUpdateProfileMutation/update-profile-body';
import type { UpdateProfileResponse } from '#features/user-settings/api/useUpdateProfileMutation/update-profile-response';
import type { UseUpdateProfileMutationResult } from '#features/user-settings/api/useUpdateProfileMutation/use-update-profile-mutation-result';

import { useState } from 'react';

import { apiClient } from '#shared/api';

export const useUpdateProfileMutation = (): UseUpdateProfileMutationResult => {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: undefined,
  });

  const mutateAsync = async (body: UpdateProfileBody): Promise<boolean> => {
    setState({ isLoading: true, error: undefined });

    try {
      await apiClient.patch<UpdateProfileResponse, UpdateProfileBody>(USERS_ME_PATH, body);
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
