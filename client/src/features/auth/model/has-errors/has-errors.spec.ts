import { describe, expect, it } from 'vitest';

import { hasErrors } from '#features/auth/model/has-errors';

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
