import { create } from 'zustand';

import type { FieldErrors, LoginFormValues, RegisterFormValues } from '#features/auth/model/types';

interface AuthFormState {
  readonly loginForm: LoginFormValues;
  readonly loginErrors: FieldErrors;
  readonly registerForm: RegisterFormValues;
  readonly registerErrors: FieldErrors;
  readonly serverError: string | undefined;
  readonly isSubmitting: boolean;
  readonly setLoginField: (field: keyof LoginFormValues, value: string) => void;
  readonly setLoginErrors: (errors: FieldErrors) => void;
  readonly setRegisterField: (field: keyof RegisterFormValues, value: string) => void;
  readonly setRegisterErrors: (errors: FieldErrors) => void;
  readonly setServerError: (error: string | undefined) => void;
  readonly setSubmitting: (isSubmitting: boolean) => void;
  readonly resetLogin: () => void;
  readonly resetRegister: () => void;
}

const INITIAL_LOGIN: LoginFormValues = { email: '', password: '' };
const INITIAL_REGISTER: RegisterFormValues = { email: '', password: '', confirmPassword: '' };

export const useAuthStore = create<AuthFormState>((set) => ({
  loginForm: INITIAL_LOGIN,
  loginErrors: {},
  registerForm: INITIAL_REGISTER,
  registerErrors: {},
  serverError: undefined,
  isSubmitting: false,

  setLoginField: (field, value) =>
    set((state) => ({
      loginForm: { ...state.loginForm, [field]: value },
      loginErrors: { ...state.loginErrors, [field]: undefined },
      serverError: undefined,
    })),

  setLoginErrors: (errors) => set({ loginErrors: errors }),

  setRegisterField: (field, value) =>
    set((state) => ({
      registerForm: { ...state.registerForm, [field]: value },
      registerErrors: { ...state.registerErrors, [field]: undefined },
      serverError: undefined,
    })),

  setRegisterErrors: (errors) => set({ registerErrors: errors }),

  setServerError: (error) => set({ serverError: error }),

  setSubmitting: (isSubmitting) => set({ isSubmitting }),

  resetLogin: () => set({ loginForm: INITIAL_LOGIN, loginErrors: {}, serverError: undefined, isSubmitting: false }),

  resetRegister: () => set({ registerForm: INITIAL_REGISTER, registerErrors: {}, serverError: undefined, isSubmitting: false }),
}));
