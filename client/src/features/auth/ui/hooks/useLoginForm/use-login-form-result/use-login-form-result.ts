import type { ChangeEvent, FormEvent } from 'react';

import type { FieldErrors } from '#features/auth/model/types/field-errors';
import type { LoginFormValues } from '#features/auth/model/types/login-form-values';

export interface UseLoginFormResult {
  readonly values: LoginFormValues;
  readonly errors: FieldErrors;
  readonly serverError: string | undefined;
  readonly isSubmitting: boolean;
  readonly handleEmailChange: (e: ChangeEvent<HTMLInputElement>) => void;
  readonly handlePasswordChange: (e: ChangeEvent<HTMLInputElement>) => void;
  readonly handleSubmit: (e: FormEvent) => void;
}
