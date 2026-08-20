import { useState } from 'react';

import type { AuthResponse, LoginFormValues } from '#features/auth/model/types';
import { ApiError, apiClient } from '#shared/api';
import { authTokens } from '#shared/api/auth-tokens';

interface LoginMutationState {
  readonly isLoading: boolean;
  readonly error: string | undefined;
}

interface UseLoginMutationResult {
  readonly state: LoginMutationState;
  readonly mutateAsync: (values: LoginFormValues) => Promise<AuthResponse>;
  readonly reset: () => void;
}

export const useLoginMutation = (): UseLoginMutationResult => {
  const [state, setState] = useState<LoginMutationState>({
    isLoading: false,
    error: undefined,
  });

  const mutateAsync = async (values: LoginFormValues): Promise<AuthResponse> => {
    setState({ isLoading: true, error: undefined });

    try {
      const response = await apiClient.post<AuthResponse, LoginFormValues>(
        '/auth/login',
        values,
        { skipAuth: true },
      );
      authTokens.setAccessToken(response.accessToken);
      setState({ isLoading: false, error: undefined });
      return response;
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 401
          ? 'Nieprawidłowy email lub hasło'
          : 'Wystąpił błąd. Spróbuj ponownie.';
      setState({ isLoading: false, error: message });
      throw error;
    }
  };

  const reset = (): void => {
    setState({ isLoading: false, error: undefined });
  };

  return { state, mutateAsync, reset };
};
