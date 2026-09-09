import { useState } from 'react';

import { USERS_ME_VAULT_PATH } from '#features/user-settings/api/constants/users-me-vault-path';
import type { MutationState } from '#features/user-settings/api/useUploadVaultMutation/mutation-state';
import type { UploadVaultBody } from '#features/user-settings/api/useUploadVaultMutation/upload-vault-body';
import type { UploadVaultResponse } from '#features/user-settings/api/useUploadVaultMutation/upload-vault-response';
import type { UseUploadVaultMutationResult } from '#features/user-settings/api/useUploadVaultMutation/use-upload-vault-mutation-result';
import { apiClient } from '#shared/api';

export const useUploadVaultMutation = (): UseUploadVaultMutationResult => {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: undefined,
  });

  const mutateAsync = async (
    body: UploadVaultBody,
  ): Promise<UploadVaultResponse> => {
    setState({ isLoading: true, error: undefined });

    try {
      const response = await apiClient.put<
        UploadVaultResponse,
        UploadVaultBody
      >(USERS_ME_VAULT_PATH, body);
      setState({ isLoading: false, error: undefined });
      return response;
    } catch (error) {
      setState({
        isLoading: false,
        error,
      });
      throw error;
    }
  };

  const reset = (): void => {
    setState({ isLoading: false, error: undefined });
  };

  return { state, mutateAsync, reset };
};
