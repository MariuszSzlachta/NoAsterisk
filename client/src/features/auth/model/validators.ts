import type { FieldErrors, LoginFormValues, RegisterFormValues } from './types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export const validateLoginForm = (values: LoginFormValues): FieldErrors => {
  const email = validateEmail(values.email);
  const password = validateLoginPassword(values.password);

  return { ...(email && { email }), ...(password && { password }) };
};

export const validateRegisterForm = (values: RegisterFormValues): FieldErrors => {
  const email = validateEmail(values.email);
  const password = validateRegisterPassword(values.password);
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
  const trimmed = email.trim();
  if (!trimmed) return 'auth.validation.emailRequired';
  if (!EMAIL_PATTERN.test(trimmed)) return 'auth.validation.emailInvalid';
  return undefined;
};

/**
 * Login password: only requires non-empty + minimum length.
 * Existing users with weaker passwords must still be able to log in.
 */
const validateLoginPassword = (password: string): string | undefined => {
  if (!password) return 'auth.validation.passwordRequired';
  if (password.length < MIN_PASSWORD_LENGTH) return 'auth.validation.passwordMinLength';
  return undefined;
};

/**
 * Registration password policy (ADR-010 / OWASP ASVS 2.1):
 * - 8–128 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 */
const validateRegisterPassword = (password: string): string | undefined => {
  if (!password) return 'auth.validation.passwordRequired';
  if (password.length < MIN_PASSWORD_LENGTH) return 'auth.validation.passwordMinLength';
  if (password.length > MAX_PASSWORD_LENGTH) return 'auth.validation.passwordMaxLength';
  if (!/[A-Z]/.test(password)) return 'auth.validation.passwordUppercase';
  if (!/[a-z]/.test(password)) return 'auth.validation.passwordLowercase';
  if (!/[0-9]/.test(password)) return 'auth.validation.passwordDigit';
  if (!/[^A-Za-z0-9]/.test(password)) return 'auth.validation.passwordSpecial';
  return undefined;
};

const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
  if (!confirmPassword) return 'auth.validation.confirmPasswordRequired';
  if (password !== confirmPassword) return 'auth.validation.passwordsMismatch';
  return undefined;
};
