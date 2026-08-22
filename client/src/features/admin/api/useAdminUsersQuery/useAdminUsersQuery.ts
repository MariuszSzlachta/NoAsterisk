import { apiClient, useApiQuery } from '#shared/api';
import type { QueryState } from '#shared/api';

// ─── Response Types ──────────────────────────────────────────────

interface AdminUserDto {
  readonly id: string;
  readonly email: string;
  readonly role: 'Superuser' | 'Member' | 'Blocked';
  readonly createdAt: string;
  readonly hasVault: boolean;
}

interface AdminUsersResponse {
  readonly users: readonly AdminUserDto[];
  readonly total: number;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useAdminUsersQuery = (): QueryState<AdminUsersResponse> => {
  return useApiQuery<AdminUsersResponse>({
    queryKey: ['admin', 'users'],
    queryFn: () => apiClient.get<AdminUsersResponse>('/admin/users'),
  });
};
