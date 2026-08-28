export interface PasswordValidationRules {
  readonly minLength: boolean;
  readonly maxLength: boolean;
  readonly hasUppercase: boolean;
  readonly hasLowercase: boolean;
  readonly hasDigit: boolean;
  readonly hasSpecialChar: boolean;
  readonly differentFromCurrent: boolean;
  readonly confirmationMatch: boolean;
}
