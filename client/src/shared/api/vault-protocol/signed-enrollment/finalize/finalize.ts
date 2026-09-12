import type { SignedEnrollmentFinalization } from '#shared/adapters/vault-protocol/enrollment-transcript';
import { apiClient } from '#shared/api';
import { signedEnrollmentPaths } from '#shared/api/vault-protocol/signed-enrollment/constants';

export const finalizeSignedEnrollment = async (
  request: SignedEnrollmentFinalization,
): Promise<void> => {
  await apiClient.post<unknown, SignedEnrollmentFinalization>(
    signedEnrollmentPaths.finalize,
    request,
  );
};
