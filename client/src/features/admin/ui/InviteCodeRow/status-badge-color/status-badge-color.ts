import type { InviteCodeStatus } from '#features/admin/model/types/invite-code-status';

export const STATUS_BADGE_COLOR: Record<InviteCodeStatus, 'income' | 'neutral' | 'warning'> = {
  Available: 'income',
  Used: 'neutral',
  Expired: 'warning',
};
