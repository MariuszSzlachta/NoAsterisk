import type { AdminUserRole } from '#features/admin/model/types/admin-user-role';

export interface AdminUserViewModel {
  readonly id: string;
  readonly email: string;
  readonly role: AdminUserRole;
  readonly createdAt: string;
  readonly hasVault: boolean;
}
