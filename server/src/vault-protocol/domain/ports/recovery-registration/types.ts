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
  /** Rechecks authority, challenge expiry and interactive-auth deadline atomically. */
  register(
    registration: RecoveryAuthorityRegistration,
    authDeadline: number,
  ): Promise<void>;
}
