import { describe, expect, it } from 'vitest';

import { hasErrors, validateLoginForm, validateRegisterForm } from './validators';

// ─── Tests ───────────────────────────────────────────────────────

describe('validateLoginForm', () => {
  it('returns empty errors for valid input', () => {
    const errors = validateLoginForm({ email: 'test@example.com', password: 'password123' });
    expect(hasErrors(errors)).toBe(false);
  });

  it('returns email required error when email is empty', () => {
    const errors = validateLoginForm({ email: '', password: 'password123' });
    expect(errors.email).toBe('auth.validation.emailRequired');
  });

  it('returns email required error when email is whitespace', () => {
    const errors = validateLoginForm({ email: '   ', password: 'password123' });
    expect(errors.email).toBe('auth.validation.emailRequired');
  });

  it('returns email invalid error for bad format', () => {
    const errors = validateLoginForm({ email: 'invalid', password: 'password123' });
    expect(errors.email).toBe('auth.validation.emailInvalid');
  });

  it('rejects single-char TLD in email', () => {
    const errors = validateLoginForm({ email: 'a@b.c', password: 'password123' });
    expect(errors.email).toBe('auth.validation.emailInvalid');
  });

  it('accepts valid email with multi-char TLD', () => {
    const errors = validateLoginForm({ email: 'user@domain.co', password: 'password123' });
    expect(errors.email).toBeUndefined();
  });

  it('returns password required error when password is empty', () => {
    const errors = validateLoginForm({ email: 'test@example.com', password: '' });
    expect(errors.password).toBe('auth.validation.passwordRequired');
  });

  it('returns password min length error when too short', () => {
    const errors = validateLoginForm({ email: 'test@example.com', password: 'short' });
    expect(errors.password).toBe('auth.validation.passwordMinLength');
  });

  it('accepts password with exactly 8 characters', () => {
    const errors = validateLoginForm({ email: 'test@example.com', password: '12345678' });
    expect(errors.password).toBeUndefined();
  });

  it('returns multiple errors when both fields invalid', () => {
    const errors = validateLoginForm({ email: '', password: '' });
    expect(errors.email).toBe('auth.validation.emailRequired');
    expect(errors.password).toBe('auth.validation.passwordRequired');
  });
});

describe('validateRegisterForm', () => {
  it('returns empty errors for valid input', () => {
    const errors = validateRegisterForm({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(hasErrors(errors)).toBe(false);
  });

  it('returns confirm password required error when empty', () => {
    const errors = validateRegisterForm({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: '',
    });
    expect(errors.confirmPassword).toBe('auth.validation.confirmPasswordRequired');
  });

  it('returns passwords mismatch error when different', () => {
    const errors = validateRegisterForm({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'different456',
    });
    expect(errors.confirmPassword).toBe('auth.validation.passwordsMismatch');
  });

  it('validates email the same as login form', () => {
    const errors = validateRegisterForm({
      email: 'bad',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(errors.email).toBe('auth.validation.emailInvalid');
  });

  it('validates password the same as login form', () => {
    const errors = validateRegisterForm({
      email: 'test@example.com',
      password: 'short',
      confirmPassword: 'short',
    });
    expect(errors.password).toBe('auth.validation.passwordMinLength');
  });

  it('returns all errors when everything invalid', () => {
    const errors = validateRegisterForm({
      email: '',
      password: '',
      confirmPassword: '',
    });
    expect(errors.email).toBe('auth.validation.emailRequired');
    expect(errors.password).toBe('auth.validation.passwordRequired');
    expect(errors.confirmPassword).toBe('auth.validation.confirmPasswordRequired');
  });
});

describe('hasErrors', () => {
  it('returns false for empty errors object', () => {
    expect(hasErrors({})).toBe(false);
  });

  it('returns false for object with only undefined values', () => {
    expect(hasErrors({ email: undefined, password: undefined })).toBe(false);
  });

  it('returns true when any error exists', () => {
    expect(hasErrors({ email: 'auth.validation.emailRequired' })).toBe(true);
  });

  it('returns true when multiple errors exist', () => {
    expect(hasErrors({ email: 'auth.validation.emailRequired', password: 'auth.validation.passwordRequired' })).toBe(true);
  });
});
