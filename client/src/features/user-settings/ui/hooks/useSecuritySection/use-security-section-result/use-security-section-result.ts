export interface UseSecuritySectionResult {
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
