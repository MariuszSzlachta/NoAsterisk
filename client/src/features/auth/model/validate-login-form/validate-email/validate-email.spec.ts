import { describe, expect, it } from 'vitest';

import { validateEmail } from './validate-email';

describe('validateEmail', () => {
  it('accepts a valid email with surrounding whitespace', () => {
    expect(validateEmail('  user@example.com  ')).toBeUndefined();
  });

  it.each([
    ['', 'auth.validation.emailRequired'],
    ['   ', 'auth.validation.emailRequired'],
    ['invalid', 'auth.validation.emailInvalid'],
    ['user@example', 'auth.validation.emailInvalid'],
  ])('returns the appropriate validation error', (email, expected) => {
    expect(validateEmail(email)).toBe(expected);
  });
});
