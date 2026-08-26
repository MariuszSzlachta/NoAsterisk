import { describe, expect, it } from 'vitest';

import { hasErrors, validateLoginForm, validateRegisterForm } from './validators';

// ─── Login form validation ───────────────────────────────────────

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

  it('accepts password with exactly 8 characters (login does not enforce strong policy)', () => {
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

// ─── Register form validation (strong password policy) ───────────

describe('validateRegisterForm', () => {
  const validInput = {
    email: 'test@example.com',
    password: 'P@ssw0rd!',
    confirmPassword: 'P@ssw0rd!',
    inviteCode: '',
  };

  it('returns empty errors for valid strong password', () => {
    const errors = validateRegisterForm(validInput);
    expect(hasErrors(errors)).toBe(false);
  });

  it('returns confirm password required error when empty', () => {
    const errors = validateRegisterForm({ ...validInput, confirmPassword: '' });
    expect(errors.confirmPassword).toBe('auth.validation.confirmPasswordRequired');
  });

  it('returns passwords mismatch error when different', () => {
    const errors = validateRegisterForm({ ...validInput, confirmPassword: 'Different1!' });
    expect(errors.confirmPassword).toBe('auth.validation.passwordsMismatch');
  });

  it('validates email the same as login form', () => {
    const errors = validateRegisterForm({ ...validInput, email: 'bad' });
    expect(errors.email).toBe('auth.validation.emailInvalid');
  });

  // --- Strong password policy ---

  it('rejects password shorter than 8 characters', () => {
    const errors = validateRegisterForm({ ...validInput, password: 'P@ss1!', confirmPassword: 'P@ss1!' });
    expect(errors.password).toBe('auth.validation.passwordMinLength');
  });

  it('rejects password longer than 128 characters', () => {
    const longPassword = 'A@1a' + 'x'.repeat(125);
    const errors = validateRegisterForm({ ...validInput, password: longPassword, confirmPassword: longPassword });
    expect(errors.password).toBe('auth.validation.passwordMaxLength');
  });

  it('rejects password without uppercase letter', () => {
    const errors = validateRegisterForm({ ...validInput, password: 'p@ssw0rd!', confirmPassword: 'p@ssw0rd!' });
    expect(errors.password).toBe('auth.validation.passwordUppercase');
  });

  it('rejects password without lowercase letter', () => {
    const errors = validateRegisterForm({ ...validInput, password: 'P@SSW0RD!', confirmPassword: 'P@SSW0RD!' });
    expect(errors.password).toBe('auth.validation.passwordLowercase');
  });

  it('rejects password without digit', () => {
    const errors = validateRegisterForm({ ...validInput, password: 'P@ssword!', confirmPassword: 'P@ssword!' });
    expect(errors.password).toBe('auth.validation.passwordDigit');
  });

  it('rejects password without special character', () => {
    const errors = validateRegisterForm({ ...validInput, password: 'Passw0rd1', confirmPassword: 'Passw0rd1' });
    expect(errors.password).toBe('auth.validation.passwordSpecial');
  });

  it('accepts password at exactly 8 characters with all requirements', () => {
    const errors = validateRegisterForm({ ...validInput, password: 'P@ssw0r!', confirmPassword: 'P@ssw0r!' });
    expect(errors.password).toBeUndefined();
  });

  it('accepts password at exactly 128 characters', () => {
    const pw = 'A@1a' + 'x'.repeat(124);
    const errors = validateRegisterForm({ ...validInput, password: pw, confirmPassword: pw });
    expect(errors.password).toBeUndefined();
  });

  it('returns all errors when everything invalid', () => {
    const errors = validateRegisterForm({
      email: '',
      password: '',
      confirmPassword: '',
      inviteCode: '',
    });
    expect(errors.email).toBe('auth.validation.emailRequired');
    expect(errors.password).toBe('auth.validation.passwordRequired');
    expect(errors.confirmPassword).toBe('auth.validation.confirmPasswordRequired');
  });
});

// ─── hasErrors ───────────────────────────────────────────────────

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
