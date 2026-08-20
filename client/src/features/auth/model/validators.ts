import type { FieldErrors, LoginFormValues, RegisterFormValues } from './types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;

export const validateLoginForm = (values: LoginFormValues): FieldErrors => {
  const errors: Record<string, string> = {};

  if (!values.email.trim()) {
    errors['email'] = 'Email jest wymagany';
  } else if (!EMAIL_PATTERN.test(values.email)) {
    errors['email'] = 'Nieprawidłowy format email';
  }

  if (!values.password) {
    errors['password'] = 'Hasło jest wymagane';
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors['password'] = `Hasło musi mieć minimum ${MIN_PASSWORD_LENGTH} znaków`;
  }

  return errors;
};

export const validateRegisterForm = (values: RegisterFormValues): FieldErrors => {
  const errors: Record<string, string> = {};

  if (!values.email.trim()) {
    errors['email'] = 'Email jest wymagany';
  } else if (!EMAIL_PATTERN.test(values.email)) {
    errors['email'] = 'Nieprawidłowy format email';
  }

  if (!values.password) {
    errors['password'] = 'Hasło jest wymagane';
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors['password'] = `Hasło musi mieć minimum ${MIN_PASSWORD_LENGTH} znaków`;
  }

  if (!values.confirmPassword) {
    errors['confirmPassword'] = 'Potwierdzenie hasła jest wymagane';
  } else if (values.password !== values.confirmPassword) {
    errors['confirmPassword'] = 'Hasła nie są identyczne';
  }

  return errors;
};

export const hasErrors = (errors: FieldErrors): boolean =>
  Object.values(errors).some(Boolean);
