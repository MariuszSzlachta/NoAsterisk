import type {
  SignedEnrollmentInput,
  SignedEnrollmentPreparation,
} from '#shared/adapters/vault-protocol/enrollment-transcript';
import { apiClient } from '#shared/api';
import { signedEnrollmentPaths } from '#shared/api/vault-protocol/signed-enrollment/constants';
import { signedEnrollmentPreparationSchema } from '#shared/api/vault-protocol/signed-enrollment/prepare/schema';

export const prepareSignedEnrollment = async (
  intent: SignedEnrollmentInput,
): Promise<SignedEnrollmentPreparation> => {
  const response = await apiClient.post<
    unknown,
    { readonly intent: SignedEnrollmentInput; readonly recoveryConfirmed: true }
  >(signedEnrollmentPaths.prepare, { intent, recoveryConfirmed: true });
  const parsed = signedEnrollmentPreparationSchema.safeParse(response);
  if (!parsed.success) throw new Error('Invalid enrollment preparation');
  const fields = Object.fromEntries(Object.entries(parsed.data.intent));
  if (!Object.entries(intent).every(([key, value]) => fields[key] === value))
    throw new Error('Enrollment preparation context mismatch');
  return parsed.data;
};
