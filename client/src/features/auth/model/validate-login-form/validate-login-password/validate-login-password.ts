import { MIN_PASSWORD_LENGTH } from '#features/auth/model/validate-login-form/constants/min-password-length';

/** Login password: only requires non-empty + minimum length. Existing users with weaker passwords must still log in. */
export const validateLoginPassword = (password: string): string | undefined => {
  if (!password) {
    return 'auth.validation.passwordRequired';
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return 'auth.validation.passwordMinLength';
  }

  return undefined;
};
