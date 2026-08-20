import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useLoginMutation } from '#features/auth/api/useLoginMutation';
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

export const useLoginForm = (): UseLoginFormResult => {
  const navigate = useNavigate();
  const { state: mutationState, mutateAsync } = useLoginMutation();

  const [values, setValues] = useState<LoginFormValues>({
    email: '',
    password: '',
  });
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

    const validationErrors = validateLoginForm(values);
    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      return;
    }

    void mutateAsync(values).then(() => {
      navigate('/dashboard');
    }).catch(() => {
      // Error is already captured in mutationState.error
    });
  };

  return {
    values,
    errors,
    serverError: mutationState.error,
    isSubmitting: mutationState.isLoading,
    handleEmailChange,
    handlePasswordChange,
    handleSubmit,
  };
};
