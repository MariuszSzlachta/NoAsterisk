import { useState } from 'react';

import type { AuthResponse, RegisterFormValues } from '#features/auth/model/types';
import { ApiError, apiClient } from '#shared/api';
import { authTokens } from '#shared/api/auth-tokens';

interface RegisterMutationState {
  readonly isLoading: boolean;
  readonly error: string | undefined;
}

interface UseRegisterMutationResult {
  readonly state: RegisterMutationState;
  readonly mutateAsync: (values: RegisterFormValues) => Promise<AuthResponse>;
  readonly reset: () => void;
}

interface RegisterBody {
  readonly email: string;
  readonly password: string;
}

export const useRegisterMutation = (): UseRegisterMutationResult => {
  const [state, setState] = useState<RegisterMutationState>({
    isLoading: false,
    error: undefined,
  });

  const mutateAsync = async (values: RegisterFormValues): Promise<AuthResponse> => {
    setState({ isLoading: true, error: undefined });

    try {
      const body: RegisterBody = { email: values.email, password: values.password };
      const response = await apiClient.post<AuthResponse, RegisterBody>(
        '/auth/register',
        body,
        { skipAuth: true },
      );
      authTokens.setAccessToken(response.accessToken);
      setState({ isLoading: false, error: undefined });
      return response;
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 409
          ? 'Konto z tym adresem email już istnieje'
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
