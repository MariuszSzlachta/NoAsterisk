// User Settings — useSecuritySection Hook

import { useState } from 'react';

import { useChangePasswordMutation } from '#features/user-settings/api/useChangePasswordMutation';
import type { PasswordFormValues } from '#features/user-settings/model/types/password-form-values';
import { isPasswordFormValid } from '#features/user-settings/model/is-password-form-valid';
import { validatePasswordForm } from '#features/user-settings/model/validate-password-form';
import { INITIAL_FORM } from '#features/user-settings/ui/hooks/useSecuritySection/constants/initial-form';
import type { UseSecuritySectionResult } from '#features/user-settings/ui/hooks/useSecuritySection/use-security-section-result';

export const useSecuritySection = (): UseSecuritySectionResult => {
  const { state, mutateAsync } = useChangePasswordMutation();
  const [formValues, setFormValues] = useState<PasswordFormValues>(INITIAL_FORM);
  const [showPasswords, setShowPasswords] = useState(false);

  const validationRules = validatePasswordForm(formValues);
  const isValid = isPasswordFormValid(validationRules);

  const handleFieldChange = (field: keyof PasswordFormValues, value: string): void => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleShowPasswords = (): void => {
    setShowPasswords((prev) => !prev);
  };

  const handleSubmit = async (): Promise<boolean> => {
    if (!isValid) {
      return false;
    }

    const success = await mutateAsync({
      currentPassword: formValues.currentPassword,
      newPassword: formValues.newPassword,
    });

    if (success) {
      setFormValues(INITIAL_FORM);
    }

    return success;
  };

  return {
    formValues,
    showPasswords,
    validationRules,
    isValid,
    isLoading: state.isLoading,
    error: state.error,
    handleFieldChange,
    handleToggleShowPasswords,
    handleSubmit,
  };
};
