import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useRegisterMutation } from '#features/auth/api/useRegisterMutation';
import { canonicalizeEmail } from '#features/auth/model/canonicalizeEmail';
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
  readonly handleInviteCodeChange: (e: ChangeEvent<HTMLInputElement>) => void;
  readonly handleSubmit: (e: FormEvent) => void;
}

const INITIAL_VALUES: RegisterFormValues = {
  email: '',
  password: '',
  confirmPassword: '',
  inviteCode: '',
};

export const useRegisterForm = (): UseRegisterFormResult => {
  const navigate = useNavigate();
  const { isLoading, error, mutateAsync } = useRegisterMutation();

  const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES);
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

  const handleInviteCodeChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setValues((prev) => ({ ...prev, inviteCode: e.target.value }));
    setErrors((prev) => ({ ...prev, inviteCode: undefined }));
  };

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();

    if (isLoading) return;

    const validationErrors = validateRegisterForm(values);
    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      return;
    }

    const body = {
      email: canonicalizeEmail(values.email),
      password: values.password,
      ...(values.inviteCode.trim() && { inviteCode: values.inviteCode.trim() }),
    };

    void mutateAsync(body)
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
    handleConfirmPasswordChange,
    handleInviteCodeChange,
    handleSubmit,
  };
};
