import type { RecoveryAuthorityRegistration } from '@vault-protocol/domain/entities/recovery-authority-registration';
import type {
  PrepareRecoveryRegistration,
  RecoveryRegistrationScope,
} from '@vault-protocol/domain/recovery-registration/types';

export interface RecoveryRegistrationRepositoryPort {
  prepare(
    request: PrepareRecoveryRegistration,
  ): Promise<RecoveryAuthorityRegistration>;
  findPending(
    scope: RecoveryRegistrationScope,
    challenge: string,
  ): Promise<RecoveryAuthorityRegistration | undefined>;
  /** Rechecks current device/key/authority and consumes the challenge atomically. */
  register(registration: RecoveryAuthorityRegistration): Promise<void>;
}
