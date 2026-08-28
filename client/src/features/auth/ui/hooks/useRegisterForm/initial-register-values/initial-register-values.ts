import type { RegisterFormValues } from '#features/auth/model/types/register-form-values';

export const INITIAL_REGISTER_VALUES: RegisterFormValues = {
  email: '',
  password: '',
  confirmPassword: '',
  inviteCode: '',
};
