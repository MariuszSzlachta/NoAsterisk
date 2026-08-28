import { MIN_PASSWORD_LENGTH } from '#features/auth/model/validate-login-form/constants/min-password-length';
import { MAX_PASSWORD_LENGTH } from '#features/auth/model/validate-register-form/constants/max-password-length';

/** Registration password policy (ADR-010 / OWASP ASVS 2.1): 8–128 chars, upper+lower+digit+special */
export const validateRegisterPassword = (password: string): string | undefined => {
  if (!password) {
    return 'auth.validation.passwordRequired';
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return 'auth.validation.passwordMinLength';
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return 'auth.validation.passwordMaxLength';
  }

  if (!/[A-Z]/.test(password)) {
    return 'auth.validation.passwordUppercase';
  }

  if (!/[a-z]/.test(password)) {
    return 'auth.validation.passwordLowercase';
  }

  if (!/[0-9]/.test(password)) {
    return 'auth.validation.passwordDigit';
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'auth.validation.passwordSpecial';
  }

  return undefined;
};
