// ═══════════════════════════════════════════════════════════════════
// User Settings — useSecuritySection Hook
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';

import { useChangePasswordMutation } from '#features/user-settings/api/useChangePasswordMutation';
import type { PasswordFormValues, PasswordValidationRules } from '#features/user-settings/model/types';
import { isPasswordFormValid, validatePasswordForm } from '#features/user-settings/model/validators';

// ─── Result Interface ────────────────────────────────────────────

interface UseSecuritySectionResult {
  readonly formValues: PasswordFormValues;
  readonly showPasswords: boolean;
  readonly validationRules: PasswordValidationRules;
  readonly isValid: boolean;
  readonly isLoading: boolean;
  readonly error: string | undefined;
  readonly handleFieldChange: (field: keyof PasswordFormValues, value: string) => void;
  readonly handleToggleShowPasswords: () => void;
  readonly handleSubmit: () => Promise<boolean>;
}

// ─── Initial State ───────────────────────────────────────────────

const INITIAL_FORM: PasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

// ─── Hook ────────────────────────────────────────────────────────

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
