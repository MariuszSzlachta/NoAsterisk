export interface RegisterFormValues {
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
  readonly inviteCode: string;
  readonly privacyAccepted?: boolean;
  readonly termsAccepted?: boolean;
}
