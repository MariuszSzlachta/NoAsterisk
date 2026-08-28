import { useState } from 'react';

import type { AuthResponse } from '#features/auth/model/types/auth-response';
import type { RegisterRequestBody } from '#features/auth/model/types/register-request-body';
import { parseAuthResponse } from '#features/auth/model/parse-auth-response';
import { useAuthStore } from '#features/auth/store/useAuthStore';
import { apiClient } from '#shared/api';
import { authTokens } from '#shared/api/auth-tokens';

import { REGISTER_ENDPOINT } from '#features/auth/api/constants/register-endpoint';
import { mapRegisterError } from '#features/auth/api/useRegisterMutation/map-register-error';
import type { UseRegisterMutationResult } from '#features/auth/api/useRegisterMutation/use-register-mutation-result';

export const useRegisterMutation = (): UseRegisterMutationResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const setRegisterSubmitting = useAuthStore((s) => s.setRegisterSubmitting);

  const mutateAsync = async (body: RegisterRequestBody): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(undefined);
    setRegisterSubmitting(true);

    try {
      const raw = await apiClient.post<unknown, RegisterRequestBody>(
        REGISTER_ENDPOINT,
        body,
        { skipAuth: true },
      );

      const response = parseAuthResponse(raw);
      authTokens.setAccessToken(response.accessToken);

      setIsLoading(false);
      setRegisterSubmitting(false);
      return response;
    } catch (err) {
      const message = mapRegisterError(err);
      setError(message);
      setIsLoading(false);
      setRegisterSubmitting(false);
      throw err;
    }
  };

  const reset = (): void => {
    setIsLoading(false);
    setError(undefined);
  };

  return { isLoading, error, mutateAsync, reset };
};
