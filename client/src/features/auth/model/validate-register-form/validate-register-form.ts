import type { FieldErrors } from '#features/auth/model/types/field-errors';
import type { RegisterFormValues } from '#features/auth/model/types/register-form-values';
import { validateEmail } from '#features/auth/model/validate-login-form/validate-email';
import { validateConfirmPassword } from '#features/auth/model/validate-register-form/validate-confirm-password';
import { validateRegisterPassword } from '#features/auth/model/validate-register-form/validate-register-password';

export const validateRegisterForm = (values: RegisterFormValues): FieldErrors => {
  const email = validateEmail(values.email);
  const password = validateRegisterPassword(values.password);
  const confirmPassword = validateConfirmPassword(values.password, values.confirmPassword);
  const privacyAccepted = values.privacyAccepted
    ? undefined
    : 'auth.validation.privacyRequired';
  const termsAccepted = values.termsAccepted
    ? undefined
    : 'auth.validation.termsRequired';

  return {
    ...(email && { email }),
    ...(password && { password }),
    ...(confirmPassword && { confirmPassword }),
    ...(privacyAccepted && { privacyAccepted }),
    ...(termsAccepted && { termsAccepted }),
  };
};
