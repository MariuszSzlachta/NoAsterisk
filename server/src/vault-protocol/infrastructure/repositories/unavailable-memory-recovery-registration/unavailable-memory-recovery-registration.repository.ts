import { DomainError } from '@budget/domain';
import { Injectable } from '@nestjs/common';
import type { RecoveryRegistrationRepositoryPort } from '@vault-protocol/domain/ports/recovery-registration';
import type { RecoveryAuthorityRegistration } from '@vault-protocol/domain/entities/recovery-authority-registration';
import type {
  PrepareRecoveryRegistration,
  RecoveryRegistrationScope,
} from '@vault-protocol/domain/recovery-registration/types';

/** Fail closed until memory enrollment/revocation/rotation share one authority graph. */
@Injectable()
export class UnavailableMemoryRecoveryRegistrationRepository implements RecoveryRegistrationRepositoryPort {
  async prepare(
    _request: PrepareRecoveryRegistration,
  ): Promise<RecoveryAuthorityRegistration> {
    throw new DomainError('Recovery authority registration is unavailable');
  }

  async findPending(
    _scope: RecoveryRegistrationScope,
    _challenge: string,
  ): Promise<RecoveryAuthorityRegistration | undefined> {
    throw new DomainError('Recovery authority registration is unavailable');
  }

  async register(
    _registration: RecoveryAuthorityRegistration,
    _authDeadline: number,
  ): Promise<void> {
    throw new DomainError('Recovery authority registration is unavailable');
  }
}
