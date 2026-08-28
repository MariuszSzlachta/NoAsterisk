import type { AuthMutationState } from '#features/auth/store/useAuthStore/auth-mutation-state';

export const INITIAL_MUTATION_STATE: AuthMutationState = {
  serverError: undefined,
  isSubmitting: false,
};
