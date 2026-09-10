import { InviteCodeStatus } from '@invite-codes/domain/invite-code-status.enum';

const INVITE_CODE_STATUSES: readonly string[] = Object.values(InviteCodeStatus);

export const isInviteCodeStatus = (value: string): value is InviteCodeStatus =>
  INVITE_CODE_STATUSES.includes(value);
