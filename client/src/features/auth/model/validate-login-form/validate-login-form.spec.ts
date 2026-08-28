import { describe, expect, it } from 'vitest';

import { hasErrors } from '#features/auth/model/has-errors';
import { validateLoginForm } from '#features/auth/model/validate-login-form';

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

  it('accepts weak password for login (existing users may have weaker passwords)', () => {
    const errors = validateLoginForm({ email: 'test@example.com', password: 'oldpassword' });
    expect(errors.password).toBeUndefined();
  });

  it('returns multiple errors when both fields invalid', () => {
    const errors = validateLoginForm({ email: '', password: '' });
    expect(errors.email).toBe('auth.validation.emailRequired');
    expect(errors.password).toBe('auth.validation.passwordRequired');
  });
});
