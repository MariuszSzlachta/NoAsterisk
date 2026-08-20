import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useRegisterMutation } from '#features/auth/api/useRegisterMutation';
import type { FieldErrors, RegisterFormValues } from '#features/auth/model/types';
import { hasErrors, validateRegisterForm } from '#features/auth/model/validators';

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
  const { state: mutationState, mutateAsync } = useRegisterMutation();

  const [values, setValues] = useState<RegisterFormValues>({
    email: '',
    password: '',
    confirmPassword: '',
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

  const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setValues((prev) => ({ ...prev, confirmPassword: e.target.value }));
    setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
  };

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();

    const validationErrors = validateRegisterForm(values);
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
    handleConfirmPasswordChange,
    handleSubmit,
  };
};
