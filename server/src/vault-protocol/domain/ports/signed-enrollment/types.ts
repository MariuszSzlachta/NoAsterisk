import type {
  SignedEnrollment,
  SignedEnrollmentInput,
  SignedEnrollmentFinalization,
  SignedEnrollmentConfirmation,
} from '@vault-protocol/domain/entities/signed-enrollment';

export interface SignedEnrollmentRepositoryPort {
  prepare(
    input: SignedEnrollmentInput,
    authDeadline: number,
  ): Promise<SignedEnrollment>;
  finalize(request: SignedEnrollmentFinalization): Promise<void>;
  confirm(request: SignedEnrollmentConfirmation): Promise<void>;
}
