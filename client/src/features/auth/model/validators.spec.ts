import { describe, expect, it } from 'vitest';

import { hasErrors, validateLoginForm, validateRegisterForm } from './validators';

describe('validateLoginForm', () => {
  it('returns empty errors for valid input', () => {
    const errors = validateLoginForm({ email: 'test@example.com', password: 'password123' });
    expect(hasErrors(errors)).toBe(false);
  });

  it('requires email', () => {
    const errors = validateLoginForm({ email: '', password: 'password123' });
    expect(errors.email).toBe('Email jest wymagany');
  });

  it('validates email format', () => {
    const errors = validateLoginForm({ email: 'invalid', password: 'password123' });
    expect(errors.email).toBe('Nieprawidłowy format email');
  });

  it('rejects single-char TLD in email', () => {
    const errors = validateLoginForm({ email: 'a@b.c', password: 'password123' });
    expect(errors.email).toBe('Nieprawidłowy format email');
  });

  it('requires password', () => {
    const errors = validateLoginForm({ email: 'test@example.com', password: '' });
    expect(errors.password).toBe('Hasło jest wymagane');
  });

  it('requires minimum 8 characters for password', () => {
    const errors = validateLoginForm({ email: 'test@example.com', password: 'short' });
    expect(errors.password).toBe('Hasło musi mieć minimum 8 znaków');
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

  it('requires confirmPassword', () => {
    const errors = validateRegisterForm({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: '',
    });
    expect(errors.confirmPassword).toBe('Potwierdzenie hasła jest wymagane');
  });

  it('rejects mismatched passwords', () => {
    const errors = validateRegisterForm({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'different456',
    });
    expect(errors.confirmPassword).toBe('Hasła nie są identyczne');
  });
});

describe('hasErrors', () => {
  it('returns false for empty errors object', () => {
    expect(hasErrors({})).toBe(false);
  });

  it('returns true when any error exists', () => {
    expect(hasErrors({ email: 'Required' })).toBe(true);
  });
});
