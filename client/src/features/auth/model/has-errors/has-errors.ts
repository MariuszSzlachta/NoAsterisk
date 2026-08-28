import type { FieldErrors } from '#features/auth/model/types/field-errors';

export const hasErrors = (errors: FieldErrors): boolean =>
  Object.values(errors).some(Boolean);
