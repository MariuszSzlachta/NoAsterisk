import type { ChangeEvent, FormEvent } from 'react';

import type { FieldErrors } from '#features/auth/model/types/field-errors';
import type { RegisterFormValues } from '#features/auth/model/types/register-form-values';

export interface UseRegisterFormResult {
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
