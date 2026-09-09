import { DomainError } from '@budget/domain';
import type { InviteCodeRepository } from '@invite-codes/domain/ports/invite-code.repository';

const claim = async (
  code: string,
  repository: InviteCodeRepository,
): Promise<string> => {
  const inviteCode = await repository.findByCode(code);
  if (!inviteCode || !inviteCode.isAvailable()) {
    throw new DomainError('Invalid invite code');
  }

  const redeemed = inviteCode.redeem('pending');
  await repository.save(redeemed);
  return inviteCode.id;
};

const assign = async (
  codeId: string,
  userId: string,
  repository: InviteCodeRepository,
): Promise<void> => {
  const code = await repository.findById(codeId);
  if (!code) {
    return;
  }

  await repository.save(code.assignUser(userId));
};

export const registrationInvite = Object.freeze({ claim, assign });
