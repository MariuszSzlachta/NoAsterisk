import { describe, expect, it } from 'vitest';

import { validateLoginPassword } from './validate-login-password';

describe('validateLoginPassword', () => {
  it('accepts an existing password at the minimum length without enforcing registration complexity', () => {
    expect(validateLoginPassword('12345678')).toBeUndefined();
  });

  it('requires a password', () => {
    expect(validateLoginPassword('')).toBe('auth.validation.passwordRequired');
  });

  it('rejects a password shorter than the minimum length', () => {
    expect(validateLoginPassword('1234567')).toBe(
      'auth.validation.passwordMinLength',
    );
  });
});
