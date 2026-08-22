import { Injectable, Inject } from '@nestjs/common';
import { DomainError } from '@budget/domain';
import {
  INVITE_CODE_REPOSITORY,
  InviteCodeRepository,
} from '@invite-codes/domain/ports/invite-code.repository';

export interface RedeemCodeCommand {
  code: string;
  userId: string;
}

@Injectable()
export class RedeemCodeHandler {
  constructor(
    @Inject(INVITE_CODE_REPOSITORY)
    private readonly repo: InviteCodeRepository,
  ) {}

  async execute(command: RedeemCodeCommand): Promise<void> {
    const inviteCode = await this.repo.findByCode(command.code);

    if (!inviteCode) {
      throw new DomainError('Invalid invite code');
    }

    const redeemed = inviteCode.redeem(command.userId);
    await this.repo.save(redeemed);
  }
}
