import type { AdminUserRole } from '#features/admin/model/types/admin-user-role';

export const ROLE_BADGE_COLOR: Record<AdminUserRole, 'primary' | 'neutral' | 'expense'> = {
  Superuser: 'primary',
  Member: 'neutral',
  Blocked: 'expense',
};
