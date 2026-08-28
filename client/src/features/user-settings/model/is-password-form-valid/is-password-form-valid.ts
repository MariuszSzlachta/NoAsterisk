import type { PasswordValidationRules } from '#features/user-settings/model/types/password-validation-rules';

export const isPasswordFormValid = (rules: PasswordValidationRules): boolean =>
  rules.minLength &&
  rules.maxLength &&
  rules.hasUppercase &&
  rules.hasLowercase &&
  rules.hasDigit &&
  rules.hasSpecialChar &&
  rules.differentFromCurrent &&
  rules.confirmationMatch;
