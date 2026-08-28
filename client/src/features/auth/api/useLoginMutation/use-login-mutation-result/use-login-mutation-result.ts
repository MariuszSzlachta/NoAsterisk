import type { AuthResponse } from '#features/auth/model/types/auth-response';
import type { LoginRequestBody } from '#features/auth/model/types/login-request-body';

export interface UseLoginMutationResult {
  readonly isLoading: boolean;
  readonly error: string | undefined;
  readonly mutateAsync: (body: LoginRequestBody) => Promise<AuthResponse>;
  readonly reset: () => void;
}
