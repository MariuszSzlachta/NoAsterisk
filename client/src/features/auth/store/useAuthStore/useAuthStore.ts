import { create } from 'zustand';

interface AuthMutationState {
  readonly serverError: string | undefined;
  readonly isSubmitting: boolean;
}

interface AuthStoreState {
  readonly login: AuthMutationState;
  readonly register: AuthMutationState;
  readonly setLoginSubmitting: (isSubmitting: boolean) => void;
  readonly setLoginError: (error: string | undefined) => void;
  readonly resetLogin: () => void;
  readonly setRegisterSubmitting: (isSubmitting: boolean) => void;
  readonly setRegisterError: (error: string | undefined) => void;
  readonly resetRegister: () => void;
}

const INITIAL_MUTATION_STATE: AuthMutationState = {
  serverError: undefined,
  isSubmitting: false,
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  login: INITIAL_MUTATION_STATE,
  register: INITIAL_MUTATION_STATE,

  setLoginSubmitting: (isSubmitting) =>
    set((state) => ({ login: { ...state.login, isSubmitting } })),

  setLoginError: (error) =>
    set((state) => ({ login: { ...state.login, serverError: error } })),

  resetLogin: () => set({ login: INITIAL_MUTATION_STATE }),

  setRegisterSubmitting: (isSubmitting) =>
    set((state) => ({ register: { ...state.register, isSubmitting } })),

  setRegisterError: (error) =>
    set((state) => ({ register: { ...state.register, serverError: error } })),

  resetRegister: () => set({ register: INITIAL_MUTATION_STATE }),
}));
