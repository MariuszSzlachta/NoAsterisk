import { apiClient, useApiQuery } from '#shared/api';
import type { QueryState } from '#shared/api';

// ─── Constants ───────────────────────────────────────────────────

const ADMIN_USERS_PATH = '/admin/users' as const;
const ADMIN_USERS_QUERY_KEY = ['admin', 'users'] as const;

// ─── Response Types ──────────────────────────────────────────────

interface AdminUserDto {
  readonly id: string;
  readonly email: string;
  readonly role: 'Superuser' | 'Member' | 'Blocked';
  readonly createdAt: string;
  readonly hasVault: boolean;
}

type AdminUsersResponse = {
  readonly users: readonly AdminUserDto[];
  readonly total: number;
} & Record<string, unknown>;

// ─── Hook ────────────────────────────────────────────────────────

export const useAdminUsersQuery = (): QueryState<AdminUsersResponse> => {
  return useApiQuery<AdminUsersResponse>({
    queryKey: [...ADMIN_USERS_QUERY_KEY],
    queryFn: () => apiClient.get<AdminUsersResponse>(ADMIN_USERS_PATH),
  });
};
