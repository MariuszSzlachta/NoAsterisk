import { apiClient, useApiQuery } from '#shared/api';
import type { QueryState } from '#shared/api';

import { ADMIN_USERS_PATH } from '#features/admin/api/constants/admin-users-path';
import { ADMIN_USERS_QUERY_KEY } from '#features/admin/api/constants/admin-users-query-key';
import type { AdminUsersResponse } from '#features/admin/api/useAdminUsersQuery/admin-users-response';

export const useAdminUsersQuery = (): QueryState<AdminUsersResponse> =>
  useApiQuery<AdminUsersResponse>({
    queryKey: [...ADMIN_USERS_QUERY_KEY],
    queryFn: () => apiClient.get<AdminUsersResponse>(ADMIN_USERS_PATH),
  });
