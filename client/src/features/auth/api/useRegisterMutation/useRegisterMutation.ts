import type { AuthResponse, RegisterRequestBody } from '#features/auth/model/types';
import { useAuthStore } from '#features/auth/store/useAuthStore';
import { ApiError, apiClient } from '#shared/api';
import { authTokens } from '#shared/api/auth-tokens';

import { AUTH_ENDPOINTS } from '../constants';

interface UseRegisterMutationResult {
  readonly isLoading: boolean;
  readonly error: string | undefined;
  readonly mutateAsync: (body: RegisterRequestBody) => Promise<AuthResponse>;
  readonly reset: () => void;
}

export const useRegisterMutation = (): UseRegisterMutationResult => {
  const isSubmitting = useAuthStore((s) => s.isSubmitting);
  const serverError = useAuthStore((s) => s.serverError);
  const setSubmitting = useAuthStore((s) => s.setSubmitting);
  const setServerError = useAuthStore((s) => s.setServerError);
  const resetRegister = useAuthStore((s) => s.resetRegister);

  const mutateAsync = async (body: RegisterRequestBody): Promise<AuthResponse> => {
    setSubmitting(true);
    setServerError(undefined);

    try {
      const response = await apiClient.post<AuthResponse, RegisterRequestBody>(
        AUTH_ENDPOINTS.REGISTER,
        body,
        { skipAuth: true },
      );
      authTokens.setAccessToken(response.accessToken);
      setSubmitting(false);
      return response;
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 409
          ? 'auth.register.emailConflict'
          : 'auth.register.genericError';
      setServerError(message);
      setSubmitting(false);
      throw error;
    }
  };

  return { isLoading: isSubmitting, error: serverError, mutateAsync, reset: resetRegister };
};
