import type { RecoveryRegistrationRepositoryPort } from '@vault-protocol/domain/ports/recovery-registration';
import { RecoveryAuthorityRegistration } from '@vault-protocol/domain/entities/recovery-authority-registration';
import { buildRecoveryRegistration } from '@vault-protocol/testing/build-recovery-registration';

export const buildRecoveryRegistrationRepositoryDouble = (
  registration: RecoveryAuthorityRegistration = new RecoveryAuthorityRegistration(
    buildRecoveryRegistration(),
  ),
): RecoveryRegistrationRepositoryPort => ({
  prepare: async () => registration,
  findPending: async () => registration,
  register: async () => undefined,
});
