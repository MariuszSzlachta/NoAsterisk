import { Inject, Injectable } from '@nestjs/common';
import { getInteractiveAuthDeadline } from '@shared/auth/get-interactive-auth-deadline';
import { SIGNED_ENROLLMENT_REPOSITORY } from '@vault-protocol/domain/ports/signed-enrollment';
import type { SignedEnrollmentRepositoryPort } from '@vault-protocol/domain/ports/signed-enrollment';
import type { FinalizeSignedEnrollmentCommand } from '@vault-protocol/application/commands/finalize-signed-enrollment/types';

@Injectable()
export class FinalizeSignedEnrollmentHandler {
  constructor(
    @Inject(SIGNED_ENROLLMENT_REPOSITORY)
    private readonly repository: SignedEnrollmentRepositoryPort,
  ) {}
  async execute(command: FinalizeSignedEnrollmentCommand): Promise<void> {
    // ARCH-EXCEPTION: scoped repository rechecks workspace ownership in its transaction — accepted permanently.
    const authDeadline = getInteractiveAuthDeadline(command.user);
    await this.repository.finalize({
      ...command.request,
      accountId: command.user.userId,
      workspaceId: command.user.workspaceId,
      authDeadline,
    });
  }
}
