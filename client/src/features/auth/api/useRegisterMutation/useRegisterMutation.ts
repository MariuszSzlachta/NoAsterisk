import { useState } from 'react';

import type { AuthResponse, RegisterRequestBody } from '#features/auth/model/types';
import { parseAuthResponse } from '#features/auth/model/parseAuthResponse';
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

/**
 * Maps backend error response to i18n key.
 * Backend returns 400 for both DomainError and Zod validation.
 * DomainError body: { statusCode: 400, message: string }
 * Zod body: { statusCode: 400, message: 'Validation failed', fields: string[] }
 */
const mapRegisterError = (err: unknown): string => {
  if (!(err instanceof ApiError)) {
    return 'auth.register.genericError';
  }

  if (err.status !== 400) {
    return 'auth.register.genericError';
  }

  const body = err.body as Record<string, unknown> | undefined;
  if (!body || typeof body['message'] !== 'string') {
    return 'auth.register.genericError';
  }

  const message = body['message'];

  if (message === 'Registration failed') {
    return 'auth.register.emailConflict';
  }

  if (message === 'Invite code is required' || message === 'Invalid invite code') {
    return 'auth.register.invalidInviteCode';
  }

  if (message === 'Validation failed') {
    return 'auth.register.validationFailed';
  }

  return 'auth.register.genericError';
};

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
        AUTH_ENDPOINTS.REGISTER,
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
