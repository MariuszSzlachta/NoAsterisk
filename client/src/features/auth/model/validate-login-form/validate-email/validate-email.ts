import { EMAIL_PATTERN } from '#features/auth/model/validate-login-form/constants/email-pattern';

export const validateEmail = (email: string): string | undefined => {
  const trimmed = email.trim();

  if (!trimmed) {
    return 'auth.validation.emailRequired';
  }

  if (!EMAIL_PATTERN.test(trimmed)) {
    return 'auth.validation.emailInvalid';
  }

  return undefined;
};
