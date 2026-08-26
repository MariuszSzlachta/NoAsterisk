import { useState } from 'react';

import type { AuthResponse, LoginRequestBody } from '#features/auth/model/types';
import { parseAuthResponse } from '#features/auth/model/parseAuthResponse';
import { useAuthStore } from '#features/auth/store/useAuthStore';
import { ApiError, apiClient } from '#shared/api';
import { authTokens } from '#shared/api/auth-tokens';

import { AUTH_ENDPOINTS } from '../constants';

interface UseLoginMutationResult {
  readonly isLoading: boolean;
  readonly error: string | undefined;
  readonly mutateAsync: (body: LoginRequestBody) => Promise<AuthResponse>;
  readonly reset: () => void;
}

export const useLoginMutation = (): UseLoginMutationResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const setLoginSubmitting = useAuthStore((s) => s.setLoginSubmitting);

  const mutateAsync = async (body: LoginRequestBody): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(undefined);
    setLoginSubmitting(true);

    try {
      const raw = await apiClient.post<unknown, LoginRequestBody>(
        AUTH_ENDPOINTS.LOGIN,
        body,
        { skipAuth: true },
      );

      const response = parseAuthResponse(raw);
      authTokens.setAccessToken(response.accessToken);

      setIsLoading(false);
      setLoginSubmitting(false);
      return response;
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 401
          ? 'auth.login.invalidCredentials'
          : 'auth.login.genericError';
      setError(message);
      setIsLoading(false);
      setLoginSubmitting(false);
      throw err;
    }
  };

  const reset = (): void => {
    setIsLoading(false);
    setError(undefined);
  };

  return { isLoading, error, mutateAsync, reset };
};
