import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { useRegisterMutation } from '#features/auth/api/useRegisterMutation';
import type { FieldErrors, RegisterFormValues } from '#features/auth/model/types';
import { hasErrors, validateRegisterForm } from '#features/auth/model/validators';
import { useAuthStore } from '#features/auth/store/useAuthStore';

interface UseRegisterFormResult {
  readonly values: RegisterFormValues;
  readonly errors: FieldErrors;
  readonly serverError: string | undefined;
  readonly isSubmitting: boolean;
  readonly handleEmailChange: (e: ChangeEvent<HTMLInputElement>) => void;
  readonly handlePasswordChange: (e: ChangeEvent<HTMLInputElement>) => void;
  readonly handleConfirmPasswordChange: (e: ChangeEvent<HTMLInputElement>) => void;
  readonly handleSubmit: (e: FormEvent) => void;
}

export const useRegisterForm = (): UseRegisterFormResult => {
  const navigate = useNavigate();
  const { isLoading, error, mutateAsync } = useRegisterMutation();

  const values = useAuthStore((s) => s.registerForm);
  const errors = useAuthStore((s) => s.registerErrors);
  const setField = useAuthStore((s) => s.setRegisterField);
  const setErrors = useAuthStore((s) => s.setRegisterErrors);

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setField('email', e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setField('password', e.target.value);
  };

  const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setField('confirmPassword', e.target.value);
  };

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();

    const validationErrors = validateRegisterForm(values);
    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      return;
    }

    void mutateAsync({ email: values.email, password: values.password })
      .then(() => {
        navigate('/dashboard');
      })
      .catch(() => {
        // Error is captured in store via mutation hook
      });
  };

  return {
    values,
    errors,
    serverError: error,
    isSubmitting: isLoading,
    handleEmailChange,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleSubmit,
  };
};
