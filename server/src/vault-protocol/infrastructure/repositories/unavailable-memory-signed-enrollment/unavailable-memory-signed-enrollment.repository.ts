import { Injectable } from '@nestjs/common';
import { DomainError } from '@budget/domain';
import type {
  SignedEnrollment,
  SignedEnrollmentInput,
  SignedEnrollmentFinalization,
  SignedEnrollmentConfirmation,
} from '@vault-protocol/domain/entities/signed-enrollment';
import type { SignedEnrollmentRepositoryPort } from '@vault-protocol/domain/ports/signed-enrollment';

/** Fail closed until enrollment/revocation/rotation share memory authority (closure #5). */
@Injectable()
export class UnavailableMemorySignedEnrollmentRepository implements SignedEnrollmentRepositoryPort {
  async prepare(
    _input: SignedEnrollmentInput,
    _authDeadline: number,
  ): Promise<SignedEnrollment> {
    throw new DomainError('Enrollment unavailable');
  }
  async finalize(_request: SignedEnrollmentFinalization): Promise<void> {
    throw new DomainError('Enrollment unavailable');
  }
  async confirm(_request: SignedEnrollmentConfirmation): Promise<void> {
    throw new DomainError('Enrollment unavailable');
  }
}
