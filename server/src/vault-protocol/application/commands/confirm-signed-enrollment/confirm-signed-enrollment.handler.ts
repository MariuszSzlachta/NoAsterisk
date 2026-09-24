import { Inject, Injectable } from '@nestjs/common';
import { getInteractiveAuthDeadline } from '@shared/auth/get-interactive-auth-deadline';
import { SIGNED_ENROLLMENT_REPOSITORY } from '@vault-protocol/domain/ports/signed-enrollment';
import type { SignedEnrollmentRepositoryPort } from '@vault-protocol/domain/ports/signed-enrollment';
import type { ConfirmSignedEnrollmentCommand } from '@vault-protocol/application/commands/confirm-signed-enrollment/types';

@Injectable()
export class ConfirmSignedEnrollmentHandler {
  constructor(
    @Inject(SIGNED_ENROLLMENT_REPOSITORY)
    private readonly repository: SignedEnrollmentRepositoryPort,
  ) {}
  async execute(command: ConfirmSignedEnrollmentCommand): Promise<void> {
    // ARCH-EXCEPTION: scoped repository rechecks workspace ownership in its transaction — accepted permanently.
    const authDeadline = getInteractiveAuthDeadline(command.user);
    await this.repository.confirm({
      ...command.request,
      accountId: command.user.userId,
      workspaceId: command.user.workspaceId,
      authDeadline,
    });
  }
}
