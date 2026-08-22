import { Injectable, Inject } from '@nestjs/common';
import { DomainError } from '@budget/domain';
import {
  INVITE_CODE_REPOSITORY,
  InviteCodeRepository,
} from '@invite-codes/domain/ports/invite-code.repository';
import { InviteCodeStatus } from '@invite-codes/domain/invite-code-status.enum';

export interface DeleteCodeCommand {
  id: string;
}

@Injectable()
export class DeleteCodeHandler {
  constructor(
    @Inject(INVITE_CODE_REPOSITORY)
    private readonly repo: InviteCodeRepository,
  ) {}

  async execute(command: DeleteCodeCommand): Promise<void> {
    const code = await this.repo.findById(command.id);

    if (!code) {
      throw new DomainError('Invite code not found');
    }

    if (code.status !== InviteCodeStatus.Available) {
      throw new DomainError('Cannot delete a code that has been used');
    }

    await this.repo.delete(command.id);
  }
}
