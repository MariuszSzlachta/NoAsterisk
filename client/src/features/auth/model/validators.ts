import type { FieldErrors, LoginFormValues, RegisterFormValues } from './types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;

export const validateLoginForm = (values: LoginFormValues): FieldErrors => {
  const email = validateEmail(values.email);
  const password = validatePassword(values.password);

  return { ...(email && { email }), ...(password && { password }) };
};

export const validateRegisterForm = (values: RegisterFormValues): FieldErrors => {
  const email = validateEmail(values.email);
  const password = validatePassword(values.password);
  const confirmPassword = validateConfirmPassword(values.password, values.confirmPassword);

  return {
    ...(email && { email }),
    ...(password && { password }),
    ...(confirmPassword && { confirmPassword }),
  };
};

export const hasErrors = (errors: FieldErrors): boolean =>
  Object.values(errors).some(Boolean);

const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) return 'auth.validation.emailRequired';
  if (!EMAIL_PATTERN.test(email)) return 'auth.validation.emailInvalid';
  return undefined;
};

const validatePassword = (password: string): string | undefined => {
  if (!password) return 'auth.validation.passwordRequired';
  if (password.length < MIN_PASSWORD_LENGTH) return 'auth.validation.passwordMinLength';
  return undefined;
};

const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
  if (!confirmPassword) return 'auth.validation.confirmPasswordRequired';
  if (password !== confirmPassword) return 'auth.validation.passwordsMismatch';
  return undefined;
};
