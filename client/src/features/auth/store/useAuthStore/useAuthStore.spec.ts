import { beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from './useAuthStore';

// ─── Tests ───────────────────────────────────────────────────────

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      loginForm: { email: '', password: '' },
      loginErrors: {},
      registerForm: { email: '', password: '', confirmPassword: '' },
      registerErrors: {},
      serverError: undefined,
      isSubmitting: false,
    });
  });

  describe('login form', () => {
    it('sets login email field and clears field error', () => {
      useAuthStore.setState({ loginErrors: { email: 'auth.validation.emailRequired' } });

      useAuthStore.getState().setLoginField('email', 'test@example.com');

      expect(useAuthStore.getState().loginForm.email).toBe('test@example.com');
      expect(useAuthStore.getState().loginErrors.email).toBeUndefined();
    });

    it('sets login password field and clears field error', () => {
      useAuthStore.setState({ loginErrors: { password: 'auth.validation.passwordRequired' } });

      useAuthStore.getState().setLoginField('password', 'secret123');

      expect(useAuthStore.getState().loginForm.password).toBe('secret123');
      expect(useAuthStore.getState().loginErrors.password).toBeUndefined();
    });

    it('clears server error when setting login field', () => {
      useAuthStore.setState({ serverError: 'auth.login.invalidCredentials' });

      useAuthStore.getState().setLoginField('email', 'x');

      expect(useAuthStore.getState().serverError).toBeUndefined();
    });

    it('sets login validation errors', () => {
      const errors = { email: 'auth.validation.emailRequired', password: 'auth.validation.passwordRequired' };

      useAuthStore.getState().setLoginErrors(errors);

      expect(useAuthStore.getState().loginErrors).toEqual(errors);
    });

    it('resets login form to initial state', () => {
      useAuthStore.setState({
        loginForm: { email: 'test@example.com', password: 'pwd123' },
        loginErrors: { email: 'err' },
        serverError: 'server err',
        isSubmitting: true,
      });

      useAuthStore.getState().resetLogin();

      expect(useAuthStore.getState().loginForm).toEqual({ email: '', password: '' });
      expect(useAuthStore.getState().loginErrors).toEqual({});
      expect(useAuthStore.getState().serverError).toBeUndefined();
      expect(useAuthStore.getState().isSubmitting).toBe(false);
    });
  });

  describe('register form', () => {
    it('sets register email field and clears field error', () => {
      useAuthStore.setState({ registerErrors: { email: 'auth.validation.emailRequired' } });

      useAuthStore.getState().setRegisterField('email', 'new@user.com');

      expect(useAuthStore.getState().registerForm.email).toBe('new@user.com');
      expect(useAuthStore.getState().registerErrors.email).toBeUndefined();
    });

    it('sets register password field and clears field error', () => {
      useAuthStore.setState({ registerErrors: { password: 'auth.validation.passwordRequired' } });

      useAuthStore.getState().setRegisterField('password', 'newpass123');

      expect(useAuthStore.getState().registerForm.password).toBe('newpass123');
      expect(useAuthStore.getState().registerErrors.password).toBeUndefined();
    });

    it('sets register confirmPassword field and clears field error', () => {
      useAuthStore.setState({ registerErrors: { confirmPassword: 'auth.validation.passwordsMismatch' } });

      useAuthStore.getState().setRegisterField('confirmPassword', 'match');

      expect(useAuthStore.getState().registerForm.confirmPassword).toBe('match');
      expect(useAuthStore.getState().registerErrors.confirmPassword).toBeUndefined();
    });

    it('clears server error when setting register field', () => {
      useAuthStore.setState({ serverError: 'auth.register.emailConflict' });

      useAuthStore.getState().setRegisterField('password', 'x');

      expect(useAuthStore.getState().serverError).toBeUndefined();
    });

    it('sets register validation errors', () => {
      const errors = { confirmPassword: 'auth.validation.passwordsMismatch' };

      useAuthStore.getState().setRegisterErrors(errors);

      expect(useAuthStore.getState().registerErrors).toEqual(errors);
    });

    it('resets register form to initial state', () => {
      useAuthStore.setState({
        registerForm: { email: 'a@b.com', password: 'pwd', confirmPassword: 'pwd' },
        registerErrors: { email: 'err' },
        serverError: 'err',
        isSubmitting: true,
      });

      useAuthStore.getState().resetRegister();

      expect(useAuthStore.getState().registerForm).toEqual({ email: '', password: '', confirmPassword: '' });
      expect(useAuthStore.getState().registerErrors).toEqual({});
      expect(useAuthStore.getState().serverError).toBeUndefined();
      expect(useAuthStore.getState().isSubmitting).toBe(false);
    });
  });

  describe('shared state', () => {
    it('sets server error', () => {
      useAuthStore.getState().setServerError('auth.login.genericError');

      expect(useAuthStore.getState().serverError).toBe('auth.login.genericError');
    });

    it('clears server error with undefined', () => {
      useAuthStore.setState({ serverError: 'something' });

      useAuthStore.getState().setServerError(undefined);

      expect(useAuthStore.getState().serverError).toBeUndefined();
    });

    it('sets submitting state', () => {
      useAuthStore.getState().setSubmitting(true);

      expect(useAuthStore.getState().isSubmitting).toBe(true);
    });

    it('clears submitting state', () => {
      useAuthStore.setState({ isSubmitting: true });

      useAuthStore.getState().setSubmitting(false);

      expect(useAuthStore.getState().isSubmitting).toBe(false);
    });
  });
});
