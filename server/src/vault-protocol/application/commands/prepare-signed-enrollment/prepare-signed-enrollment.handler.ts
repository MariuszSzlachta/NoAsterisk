import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '@budget/domain';
import { getInteractiveAuthDeadline } from '@shared/auth/get-interactive-auth-deadline';
import { SIGNED_ENROLLMENT_REPOSITORY } from '@vault-protocol/domain/ports/signed-enrollment';
import type { SignedEnrollmentRepositoryPort } from '@vault-protocol/domain/ports/signed-enrollment';
import type { SignedEnrollment } from '@vault-protocol/domain/entities/signed-enrollment';
import type { PrepareSignedEnrollmentCommand } from '@vault-protocol/application/commands/prepare-signed-enrollment/types';

@Injectable()
export class PrepareSignedEnrollmentHandler {
  constructor(
    @Inject(SIGNED_ENROLLMENT_REPOSITORY)
    private readonly repository: SignedEnrollmentRepositoryPort,
  ) {}
  async execute(
    command: PrepareSignedEnrollmentCommand,
  ): Promise<SignedEnrollment> {
    // ARCH-EXCEPTION: returned domain entity asserts the complete workspace scope — accepted permanently.
    const deadline = getInteractiveAuthDeadline(command.user);
    if (!command.recoveryConfirmed)
      throw new DomainError('Enrollment unavailable');
    const input = {
      ...command.intent,
      accountId: command.user.userId,
      workspaceId: command.user.workspaceId,
    };
    const prepared = await this.repository.prepare(input, deadline);
    try {
      prepared.assertScope(input);
      return prepared;
    } catch (error) {
      prepared.disposePreparedShare();
      throw error;
    }
  }
}
