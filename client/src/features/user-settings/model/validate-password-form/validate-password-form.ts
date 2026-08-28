import type { PasswordFormValues } from '#features/user-settings/model/types/password-form-values';
import type { PasswordValidationRules } from '#features/user-settings/model/types/password-validation-rules';
import { MAX_PASSWORD_LENGTH } from '#features/user-settings/model/validate-password-form/constants/max-password-length';
import { MIN_PASSWORD_LENGTH } from '#features/user-settings/model/validate-password-form/constants/min-password-length';

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
