import { create } from 'zustand';

import { INITIAL_MUTATION_STATE } from '#features/auth/store/useAuthStore/initial-mutation-state';
import type { AuthStoreState } from '#features/auth/store/useAuthStore/auth-store-state';

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
