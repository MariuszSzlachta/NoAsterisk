import type { FieldErrors } from '#features/auth/model/types/field-errors';
import type { LoginFormValues } from '#features/auth/model/types/login-form-values';
import { validateEmail } from '#features/auth/model/validate-login-form/validate-email';
import { validateLoginPassword } from '#features/auth/model/validate-login-form/validate-login-password';

export const validateLoginForm = (values: LoginFormValues): FieldErrors => {
  const email = validateEmail(values.email);
  const password = validateLoginPassword(values.password);

  return { ...(email && { email }), ...(password && { password }) };
};
