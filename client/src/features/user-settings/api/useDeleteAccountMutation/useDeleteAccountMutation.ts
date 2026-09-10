import { USERS_ME_DELETE_PATH } from '#features/user-settings/api/constants/users-me-delete-path';
import type { DeleteAccountBody } from '#features/user-settings/api/useDeleteAccountMutation/delete-account-body';
import type { MutationState } from '#features/user-settings/api/useDeleteAccountMutation/mutation-state';
import type { UseDeleteAccountMutationResult } from '#features/user-settings/api/useDeleteAccountMutation/use-delete-account-mutation-result';

import { useState } from 'react';

import { ApiError, apiClient } from '#shared/api';

export const useDeleteAccountMutation = (): UseDeleteAccountMutationResult => {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: undefined,
  });

  const mutateAsync = async (body: DeleteAccountBody): Promise<boolean> => {
    setState({ isLoading: true, error: undefined });

    try {
      await apiClient.delete<Record<string, never>, DeleteAccountBody>(
        USERS_ME_DELETE_PATH,
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
