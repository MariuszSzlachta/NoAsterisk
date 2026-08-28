import { apiClient, useApiQuery } from '#shared/api';
import type { QueryState } from '#shared/api';

import { INVITE_CODES_PATH } from '#features/admin/api/constants/invite-codes-path';
import { INVITE_CODES_QUERY_KEY } from '#features/admin/api/constants/invite-codes-query-key';
import type { InviteCodesResponse } from '#features/admin/api/useInviteCodesQuery/invite-codes-response';

export const useInviteCodesQuery = (): QueryState<InviteCodesResponse> =>
  useApiQuery<InviteCodesResponse>({
    queryKey: [...INVITE_CODES_QUERY_KEY],
    queryFn: () => apiClient.get<InviteCodesResponse>(INVITE_CODES_PATH),
  });
