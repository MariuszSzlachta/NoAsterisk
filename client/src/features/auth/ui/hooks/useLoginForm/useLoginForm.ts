import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useLoginMutation } from '#features/auth/api/useLoginMutation';
import { canonicalizeEmail } from '#features/auth/model/canonicalizeEmail';
import type { FieldErrors, LoginFormValues } from '#features/auth/model/types';
import { hasErrors, validateLoginForm } from '#features/auth/model/validators';

interface UseLoginFormResult {
  readonly values: LoginFormValues;
  readonly errors: FieldErrors;
  readonly serverError: string | undefined;
  readonly isSubmitting: boolean;
  readonly handleEmailChange: (e: ChangeEvent<HTMLInputElement>) => void;
  readonly handlePasswordChange: (e: ChangeEvent<HTMLInputElement>) => void;
  readonly handleSubmit: (e: FormEvent) => void;
}

const INITIAL_VALUES: LoginFormValues = { email: '', password: '' };

export const useLoginForm = (): UseLoginFormResult => {
  const navigate = useNavigate();
  const { isLoading, error, mutateAsync } = useLoginMutation();

  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setValues((prev) => ({ ...prev, email: e.target.value }));
    setErrors((prev) => ({ ...prev, email: undefined }));
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setValues((prev) => ({ ...prev, password: e.target.value }));
    setErrors((prev) => ({ ...prev, password: undefined }));
  };

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();

    if (isLoading) return;

    const validationErrors = validateLoginForm(values);
    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      return;
    }

    void mutateAsync({
      email: canonicalizeEmail(values.email),
      password: values.password,
    })
      .then(() => {
        setValues(INITIAL_VALUES);
        navigate('/dashboard');
      })
      .catch(() => {
        // Error is captured in mutation hook state
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
