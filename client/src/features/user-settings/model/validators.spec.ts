import { describe, expect, it } from 'vitest';

import type { PasswordFormValues } from '#features/user-settings/model/types/password-form-values';
import type { PasswordValidationRules } from '#features/user-settings/model/types/password-validation-rules';
import { isPasswordFormValid } from '#features/user-settings/model/is-password-form-valid';
import { validateDisplayName } from '#features/user-settings/model/validate-display-name';
import { validatePasswordForm } from '#features/user-settings/model/validate-password-form';

// ─── Test Helpers ────────────────────────────────────────────────

const buildPasswordForm = (overrides?: Partial<PasswordFormValues>): PasswordFormValues => ({
  currentPassword: 'OldPass123!',
  newPassword: 'NewPass456!',
  confirmPassword: 'NewPass456!',
  ...overrides,
});

// ─── validatePasswordForm ────────────────────────────────────────

describe('validatePasswordForm', () => {
  describe('minLength', () => {
    it.each([
      { newPassword: '1234567', expected: false },
      { newPassword: '12345678', expected: true },
      { newPassword: 'Abcdefg1!', expected: true },
      { newPassword: '', expected: false },
    ])('returns $expected when newPassword is "$newPassword"', ({ newPassword, expected }) => {
      const result = validatePasswordForm(buildPasswordForm({ newPassword }));
      expect(result.minLength).toBe(expected);
    });
  });

  describe('maxLength', () => {
    it('returns true for 128 chars', () => {
      const result = validatePasswordForm(buildPasswordForm({ newPassword: 'A'.repeat(128) }));
      expect(result.maxLength).toBe(true);
    });

    it('returns false for 129 chars', () => {
      const result = validatePasswordForm(buildPasswordForm({ newPassword: 'A'.repeat(129) }));
      expect(result.maxLength).toBe(false);
    });
  });

  describe('hasUppercase', () => {
    it('returns true when password contains uppercase letter', () => {
      const result = validatePasswordForm(buildPasswordForm({ newPassword: 'Abcdefg1!' }));
      expect(result.hasUppercase).toBe(true);
    });

    it('returns false when password has no uppercase letter', () => {
      const result = validatePasswordForm(buildPasswordForm({ newPassword: 'abcdefg1!' }));
      expect(result.hasUppercase).toBe(false);
    });
  });

  describe('hasLowercase', () => {
    it('returns true when password contains lowercase letter', () => {
      const result = validatePasswordForm(buildPasswordForm({ newPassword: 'ABCDEFg1!' }));
      expect(result.hasLowercase).toBe(true);
    });

    it('returns false when password has no lowercase letter', () => {
      const result = validatePasswordForm(buildPasswordForm({ newPassword: 'ABCDEFG1!' }));
      expect(result.hasLowercase).toBe(false);
    });
  });

  describe('hasDigit', () => {
    it('returns true when password contains digit', () => {
      const result = validatePasswordForm(buildPasswordForm({ newPassword: 'Abcdefg1!' }));
      expect(result.hasDigit).toBe(true);
    });

    it('returns false when password has no digit', () => {
      const result = validatePasswordForm(buildPasswordForm({ newPassword: 'Abcdefgh!' }));
      expect(result.hasDigit).toBe(false);
    });
  });

  describe('hasSpecialChar', () => {
    it('returns true when password contains special character', () => {
      const result = validatePasswordForm(buildPasswordForm({ newPassword: 'Abcdefg1!' }));
      expect(result.hasSpecialChar).toBe(true);
    });

    it('returns false when password has no special character', () => {
      const result = validatePasswordForm(buildPasswordForm({ newPassword: 'Abcdefg1A' }));
      expect(result.hasSpecialChar).toBe(false);
    });
  });

  describe('differentFromCurrent', () => {
    it('returns false when new password equals current', () => {
      const result = validatePasswordForm(
        buildPasswordForm({ currentPassword: 'Same123!', newPassword: 'Same123!' }),
      );
      expect(result.differentFromCurrent).toBe(false);
    });

    it('returns true when new password differs from current', () => {
      const result = validatePasswordForm(
        buildPasswordForm({ currentPassword: 'Old123!', newPassword: 'New456!A' }),
      );
      expect(result.differentFromCurrent).toBe(true);
    });

    it('returns false when new password is empty', () => {
      const result = validatePasswordForm(buildPasswordForm({ newPassword: '' }));
      expect(result.differentFromCurrent).toBe(false);
    });
  });

  describe('confirmationMatch', () => {
    it('returns true when confirmation matches new password', () => {
      const result = validatePasswordForm(
        buildPasswordForm({ newPassword: 'Abc12345!', confirmPassword: 'Abc12345!' }),
      );
      expect(result.confirmationMatch).toBe(true);
    });

    it('returns false when confirmation differs from new password', () => {
      const result = validatePasswordForm(
        buildPasswordForm({ newPassword: 'Abc12345!', confirmPassword: 'Different!' }),
      );
      expect(result.confirmationMatch).toBe(false);
    });

    it('returns false when confirmation is empty', () => {
      const result = validatePasswordForm(
        buildPasswordForm({ confirmPassword: '' }),
      );
      expect(result.confirmationMatch).toBe(false);
    });
  });
});

// ─── isPasswordFormValid ─────────────────────────────────────────

describe('isPasswordFormValid', () => {
  const allValid: PasswordValidationRules = {
    minLength: true,
    maxLength: true,
    hasUppercase: true,
    hasLowercase: true,
    hasDigit: true,
    hasSpecialChar: true,
    differentFromCurrent: true,
    confirmationMatch: true,
  };

  it('returns true when all rules are satisfied', () => {
    expect(isPasswordFormValid(allValid)).toBe(true);
  });

  it.each<{ rule: keyof PasswordValidationRules }>([
    { rule: 'minLength' },
    { rule: 'maxLength' },
    { rule: 'hasUppercase' },
    { rule: 'hasLowercase' },
    { rule: 'hasDigit' },
    { rule: 'hasSpecialChar' },
    { rule: 'differentFromCurrent' },
    { rule: 'confirmationMatch' },
  ])('returns false when $rule is false', ({ rule }) => {
    const rules: PasswordValidationRules = { ...allValid, [rule]: false };
    expect(isPasswordFormValid(rules)).toBe(false);
  });
});

// ─── validateDisplayName ─────────────────────────────────────────

describe('validateDisplayName', () => {
  it('returns undefined for valid name (≤50 chars)', () => {
    expect(validateDisplayName('a'.repeat(50))).toBeUndefined();
  });

  it('returns TOO_LONG for name exceeding 50 chars', () => {
    expect(validateDisplayName('a'.repeat(51))).toBe('TOO_LONG');
  });

  it('returns undefined for empty string', () => {
    expect(validateDisplayName('')).toBeUndefined();
  });
});
