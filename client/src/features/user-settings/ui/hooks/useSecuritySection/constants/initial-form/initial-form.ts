import type { PasswordFormValues } from '#features/user-settings/model/types/password-form-values';

export const INITIAL_FORM: PasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};
