import { apiClient } from '#shared/api';
import { RECOVERY_REGISTRATION_PATHS } from '#shared/api/vault-protocol/recovery-registration/constants';
import type { RecoveryRegistrationConfirmation } from '#shared/api/vault-protocol/recovery-registration/types';

export const confirmRecoveryRegistration = async (
  input: RecoveryRegistrationConfirmation,
  signal: AbortSignal,
): Promise<void> => {
  await apiClient.post(RECOVERY_REGISTRATION_PATHS.confirm, input, { signal });
};
