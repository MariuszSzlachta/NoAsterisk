import { describe, expect, it } from 'vitest';

import { validateRegisterPassword } from './validate-register-password';

describe('validateRegisterPassword', () => {
  it('accepts a password that satisfies the registration policy', () => {
    expect(validateRegisterPassword('P@ssw0rd')).toBeUndefined();
  });

  it.each([
    ['', 'auth.validation.passwordRequired'],
    ['P@ss1!', 'auth.validation.passwordMinLength'],
    [`A@1a${'x'.repeat(125)}`, 'auth.validation.passwordMaxLength'],
    ['p@ssw0rd', 'auth.validation.passwordUppercase'],
    ['P@SSW0RD', 'auth.validation.passwordLowercase'],
    ['P@ssword', 'auth.validation.passwordDigit'],
    ['Passw0rd', 'auth.validation.passwordSpecial'],
  ])('returns the first violated policy rule', (password, expected) => {
    expect(validateRegisterPassword(password)).toBe(expected);
  });

  it('accepts a valid password at the maximum length', () => {
    expect(validateRegisterPassword(`A@1a${'x'.repeat(124)}`)).toBeUndefined();
  });
});
