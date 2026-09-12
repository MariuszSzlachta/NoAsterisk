import type { SignedEnrollmentConfirmation } from '#shared/adapters/vault-protocol/enrollment-transcript';
import { apiClient } from '#shared/api';
import { signedEnrollmentPaths } from '#shared/api/vault-protocol/signed-enrollment/constants';

export const confirmSignedEnrollment = async (
  request: SignedEnrollmentConfirmation,
): Promise<void> => {
  await apiClient.post<unknown, SignedEnrollmentConfirmation>(
    signedEnrollmentPaths.confirm,
    request,
  );
};
