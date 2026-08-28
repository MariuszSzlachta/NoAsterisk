import type { AdminUserDto } from '#features/admin/api/useAdminUsersQuery/admin-user-dto';

export type AdminUsersResponse = {
  readonly users: readonly AdminUserDto[];
  readonly total: number;
} & Record<string, unknown>;
