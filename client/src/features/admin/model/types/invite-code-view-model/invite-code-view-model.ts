import type { InviteCodeStatus } from '#features/admin/model/types/invite-code-status';

export interface InviteCodeViewModel {
  readonly id: string;
  readonly code: string;
  readonly status: InviteCodeStatus;
  readonly createdAt: string;
  readonly expiresAt: string | undefined;
  readonly usedBy: string | undefined;
  readonly usedAt: string | undefined;
}
