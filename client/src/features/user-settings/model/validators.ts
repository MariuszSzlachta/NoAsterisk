// ═══════════════════════════════════════════════════════════════════
// User Settings Feature — Validators
// ═══════════════════════════════════════════════════════════════════

import type { PasswordFormValues, PasswordValidationRules } from './types';

// ─── Password Validation (OWASP ASVS 2.1 compliant) ─────────────

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export const validatePasswordForm = (values: PasswordFormValues): PasswordValidationRules => ({
  minLength: values.newPassword.length >= MIN_PASSWORD_LENGTH,
  maxLength: values.newPassword.length <= MAX_PASSWORD_LENGTH,
  hasUppercase: /[A-Z]/.test(values.newPassword),
  hasLowercase: /[a-z]/.test(values.newPassword),
  hasDigit: /\d/.test(values.newPassword),
  hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(values.newPassword),
  differentFromCurrent:
    values.newPassword.length > 0 && values.newPassword !== values.currentPassword,
  confirmationMatch:
    values.confirmPassword.length > 0 && values.confirmPassword === values.newPassword,
});

export const isPasswordFormValid = (rules: PasswordValidationRules): boolean =>
  rules.minLength &&
  rules.maxLength &&
  rules.hasUppercase &&
  rules.hasLowercase &&
  rules.hasDigit &&
  rules.hasSpecialChar &&
  rules.differentFromCurrent &&
  rules.confirmationMatch;

// ─── Display Name Validation ─────────────────────────────────────

export type DisplayNameError = 'TOO_LONG';

const MAX_DISPLAY_NAME_LENGTH = 50;

export const validateDisplayName = (name: string): DisplayNameError | undefined => {
  if (name.length > MAX_DISPLAY_NAME_LENGTH) {
    return 'TOO_LONG';
  }
  return undefined;
};
