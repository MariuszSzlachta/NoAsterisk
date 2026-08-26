import { beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from './useAuthStore';

// ─── Tests ───────────────────────────────────────────────────────

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      login: { serverError: undefined, isSubmitting: false },
      register: { serverError: undefined, isSubmitting: false },
    });
  });

  describe('login mutation state', () => {
    it('sets login submitting state', () => {
      useAuthStore.getState().setLoginSubmitting(true);

      expect(useAuthStore.getState().login.isSubmitting).toBe(true);
    });

    it('sets login error', () => {
      useAuthStore.getState().setLoginError('auth.login.invalidCredentials');

      expect(useAuthStore.getState().login.serverError).toBe('auth.login.invalidCredentials');
    });

    it('clears login error with undefined', () => {
      useAuthStore.setState({ login: { serverError: 'error', isSubmitting: false } });

      useAuthStore.getState().setLoginError(undefined);

      expect(useAuthStore.getState().login.serverError).toBeUndefined();
    });

    it('resets login state without affecting register', () => {
      useAuthStore.setState({
        login: { serverError: 'err', isSubmitting: true },
        register: { serverError: 'register-err', isSubmitting: true },
      });

      useAuthStore.getState().resetLogin();

      expect(useAuthStore.getState().login).toEqual({
        serverError: undefined,
        isSubmitting: false,
      });
      expect(useAuthStore.getState().register).toEqual({
        serverError: 'register-err',
        isSubmitting: true,
      });
    });
  });

  describe('register mutation state', () => {
    it('sets register submitting state', () => {
      useAuthStore.getState().setRegisterSubmitting(true);

      expect(useAuthStore.getState().register.isSubmitting).toBe(true);
    });

    it('sets register error', () => {
      useAuthStore.getState().setRegisterError('auth.register.emailConflict');

      expect(useAuthStore.getState().register.serverError).toBe('auth.register.emailConflict');
    });

    it('clears register error with undefined', () => {
      useAuthStore.setState({ register: { serverError: 'error', isSubmitting: false } });

      useAuthStore.getState().setRegisterError(undefined);

      expect(useAuthStore.getState().register.serverError).toBeUndefined();
    });

    it('resets register state without affecting login', () => {
      useAuthStore.setState({
        login: { serverError: 'login-err', isSubmitting: true },
        register: { serverError: 'err', isSubmitting: true },
      });

      useAuthStore.getState().resetRegister();

      expect(useAuthStore.getState().register).toEqual({
        serverError: undefined,
        isSubmitting: false,
      });
      expect(useAuthStore.getState().login).toEqual({
        serverError: 'login-err',
        isSubmitting: true,
      });
    });
  });

  describe('isolation', () => {
    it('login and register state are independent', () => {
      useAuthStore.getState().setLoginSubmitting(true);
      useAuthStore.getState().setLoginError('login err');

      expect(useAuthStore.getState().register.isSubmitting).toBe(false);
      expect(useAuthStore.getState().register.serverError).toBeUndefined();
    });
  });
});
