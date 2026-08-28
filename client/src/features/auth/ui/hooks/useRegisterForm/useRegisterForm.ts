import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useRegisterMutation } from '#features/auth/api/useRegisterMutation';
import { canonicalizeEmail } from '#features/auth/model/canonicalize-email';
import type { FieldErrors } from '#features/auth/model/types/field-errors';
import type { RegisterFormValues } from '#features/auth/model/types/register-form-values';
import { hasErrors } from '#features/auth/model/has-errors';
import { validateRegisterForm } from '#features/auth/model/validate-register-form';

import { DASHBOARD_ROUTE } from '#features/auth/ui/hooks/useRegisterForm/constants/dashboard-route';
import { INITIAL_REGISTER_VALUES } from '#features/auth/ui/hooks/useRegisterForm/initial-register-values';
import type { UseRegisterFormResult } from '#features/auth/ui/hooks/useRegisterForm/use-register-form-result';

export const useRegisterForm = (): UseRegisterFormResult => {
  const navigate = useNavigate();
  const { isLoading, error, mutateAsync } = useRegisterMutation();

  const [values, setValues] = useState<RegisterFormValues>(INITIAL_REGISTER_VALUES);
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

    if (isLoading) {
      return;
    }

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
        setValues(INITIAL_REGISTER_VALUES);
        navigate(DASHBOARD_ROUTE);
      })
      .catch(() => undefined);
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
