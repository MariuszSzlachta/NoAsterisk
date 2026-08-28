import { useState } from 'react';

import type { AuthResponse } from '#features/auth/model/types/auth-response';
import type { LoginRequestBody } from '#features/auth/model/types/login-request-body';
import { parseAuthResponse } from '#features/auth/model/parse-auth-response';
import { useAuthStore } from '#features/auth/store/useAuthStore';
import { ApiError, apiClient } from '#shared/api';
import { authTokens } from '#shared/api/auth-tokens';

import { GENERIC_LOGIN_ERROR } from '#features/auth/api/useLoginMutation/constants/generic-login-error';
import { HTTP_UNAUTHORIZED } from '#features/auth/api/useLoginMutation/constants/http-unauthorized';
import { INVALID_CREDENTIALS_ERROR } from '#features/auth/api/useLoginMutation/constants/invalid-credentials-error';
import { LOGIN_ENDPOINT } from '#features/auth/api/constants/login-endpoint';
import type { UseLoginMutationResult } from '#features/auth/api/useLoginMutation/use-login-mutation-result';

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
        LOGIN_ENDPOINT,
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
        err instanceof ApiError && err.status === HTTP_UNAUTHORIZED
          ? INVALID_CREDENTIALS_ERROR
          : GENERIC_LOGIN_ERROR;
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
