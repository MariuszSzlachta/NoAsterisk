import type { AuthMutationState } from '#features/auth/store/useAuthStore/auth-mutation-state';

export interface AuthStoreState {
  readonly login: AuthMutationState;
  readonly register: AuthMutationState;
  readonly setLoginSubmitting: (isSubmitting: boolean) => void;
  readonly setLoginError: (error: string | undefined) => void;
  readonly resetLogin: () => void;
  readonly setRegisterSubmitting: (isSubmitting: boolean) => void;
  readonly setRegisterError: (error: string | undefined) => void;
  readonly resetRegister: () => void;
}
