import type { AuthResponse, LoginRequestBody } from '#features/auth/model/types';
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
  const isSubmitting = useAuthStore((s) => s.isSubmitting);
  const serverError = useAuthStore((s) => s.serverError);
  const setSubmitting = useAuthStore((s) => s.setSubmitting);
  const setServerError = useAuthStore((s) => s.setServerError);
  const resetLogin = useAuthStore((s) => s.resetLogin);

  const mutateAsync = async (body: LoginRequestBody): Promise<AuthResponse> => {
    setSubmitting(true);
    setServerError(undefined);

    try {
      const response = await apiClient.post<AuthResponse, LoginRequestBody>(
        AUTH_ENDPOINTS.LOGIN,
        body,
        { skipAuth: true },
      );
      authTokens.setAccessToken(response.accessToken);
      setSubmitting(false);
      return response;
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 401
          ? 'auth.login.invalidCredentials'
          : 'auth.login.genericError';
      setServerError(message);
      setSubmitting(false);
      throw error;
    }
  };

  return { isLoading: isSubmitting, error: serverError, mutateAsync, reset: resetLogin };
};
