import { describe, expect, it } from 'vitest';

import { validateConfirmPassword } from './validate-confirm-password';

describe('validateConfirmPassword', () => {
  it('accepts matching passwords', () => {
    expect(validateConfirmPassword('P@ssw0rd', 'P@ssw0rd')).toBeUndefined();
  });

  it('requires a confirmation', () => {
    expect(validateConfirmPassword('P@ssw0rd', '')).toBe(
      'auth.validation.confirmPasswordRequired',
    );
  });

  it('rejects a different confirmation', () => {
    expect(validateConfirmPassword('P@ssw0rd', 'Different1!')).toBe(
      'auth.validation.passwordsMismatch',
    );
  });
});
