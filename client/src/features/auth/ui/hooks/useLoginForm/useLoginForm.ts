import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useLoginMutation } from '#features/auth/api/useLoginMutation';
import { passkeyLogin } from '#features/auth/api/passkey-login';
import { canonicalizeEmail } from '#features/auth/model/canonicalize-email';
import type { FieldErrors } from '#features/auth/model/types/field-errors';
import type { LoginFormValues } from '#features/auth/model/types/login-form-values';
import { hasErrors } from '#features/auth/model/has-errors';
import { validateLoginForm } from '#features/auth/model/validate-login-form';
import { validateEmail } from '#features/auth/model/validate-login-form/validate-email';

import { DASHBOARD_ROUTE } from '#features/auth/ui/hooks/useLoginForm/constants/dashboard-route';
import { INITIAL_LOGIN_VALUES } from '#features/auth/ui/hooks/useLoginForm/initial-login-values';
import type { UseLoginFormResult } from '#features/auth/ui/hooks/useLoginForm/use-login-form-result';

export const useLoginForm = (): UseLoginFormResult => {
  const navigate = useNavigate();
  const { isLoading, error, mutateAsync } = useLoginMutation();
  const [isPasskeySubmitting, setIsPasskeySubmitting] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | undefined>();

  const [values, setValues] = useState<LoginFormValues>(INITIAL_LOGIN_VALUES);
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

    if (isLoading) {
      return;
    }

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
        setValues(INITIAL_LOGIN_VALUES);
        navigate(DASHBOARD_ROUTE);
      })
      .catch(() => undefined);
  };

  const handlePasskeyLogin = (): void => {
    if (isLoading || isPasskeySubmitting) return;
    const emailError = validateEmail(values.email);
    if (emailError !== undefined) {
      setErrors((previous) => ({ ...previous, email: emailError }));
      return;
    }
    setIsPasskeySubmitting(true);
    setPasskeyError(undefined);
    void passkeyLogin
      .run(values.email)
      .then(() => {
        setValues(INITIAL_LOGIN_VALUES);
        navigate(DASHBOARD_ROUTE);
      })
      .catch(() => setPasskeyError('auth.login.passkeyError'))
      .finally(() => setIsPasskeySubmitting(false));
  };

  return {
    values,
    errors,
    serverError: error ?? passkeyError,
    isSubmitting: isLoading || isPasskeySubmitting,
    isPasskeySubmitting,
    handlePasskeyLogin,
    handleEmailChange,
    handlePasswordChange,
    handleSubmit,
  };
};
