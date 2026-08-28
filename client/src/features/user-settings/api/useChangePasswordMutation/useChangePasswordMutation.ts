import { USERS_ME_CHANGE_PASSWORD_PATH } from '#features/user-settings/api/constants/users-me-change-password-path';
import type { ChangePasswordBody } from '#features/user-settings/api/useChangePasswordMutation/change-password-body';
import type { MutationState } from '#features/user-settings/api/useChangePasswordMutation/mutation-state';
import type { UseChangePasswordMutationResult } from '#features/user-settings/api/useChangePasswordMutation/use-change-password-mutation-result';

import { useState } from 'react';

import { ApiError, apiClient } from '#shared/api';

export const useChangePasswordMutation = (): UseChangePasswordMutationResult => {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: undefined,
  });

  const mutateAsync = async (body: ChangePasswordBody): Promise<boolean> => {
    setState({ isLoading: true, error: undefined });

    try {
      await apiClient.post<ChangePasswordResponse, ChangePasswordBody>(
        USERS_ME_CHANGE_PASSWORD_PATH,
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
