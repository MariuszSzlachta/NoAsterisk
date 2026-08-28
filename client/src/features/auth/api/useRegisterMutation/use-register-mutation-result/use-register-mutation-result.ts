import type { AuthResponse } from '#features/auth/model/types/auth-response';
import type { RegisterRequestBody } from '#features/auth/model/types/register-request-body';

export interface UseRegisterMutationResult {
  readonly isLoading: boolean;
  readonly error: string | undefined;
  readonly mutateAsync: (body: RegisterRequestBody) => Promise<AuthResponse>;
  readonly reset: () => void;
}
