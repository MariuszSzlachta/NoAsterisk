import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { useLoginMutation } from '#features/auth/api/useLoginMutation';
import type { FieldErrors, LoginFormValues } from '#features/auth/model/types';
import { hasErrors, validateLoginForm } from '#features/auth/model/validators';
import { useAuthStore } from '#features/auth/store/useAuthStore';

interface UseLoginFormResult {
  readonly values: LoginFormValues;
  readonly errors: FieldErrors;
  readonly serverError: string | undefined;
  readonly isSubmitting: boolean;
  readonly handleEmailChange: (e: ChangeEvent<HTMLInputElement>) => void;
  readonly handlePasswordChange: (e: ChangeEvent<HTMLInputElement>) => void;
  readonly handleSubmit: (e: FormEvent) => void;
}

export const useLoginForm = (): UseLoginFormResult => {
  const navigate = useNavigate();
  const { isLoading, error, mutateAsync } = useLoginMutation();

  const values = useAuthStore((s) => s.loginForm);
  const errors = useAuthStore((s) => s.loginErrors);
  const setField = useAuthStore((s) => s.setLoginField);
  const setErrors = useAuthStore((s) => s.setLoginErrors);

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setField('email', e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setField('password', e.target.value);
  };

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();

    const validationErrors = validateLoginForm(values);
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
    handleSubmit,
  };
};
