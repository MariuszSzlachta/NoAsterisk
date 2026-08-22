import { apiClient, useApiQuery } from '#shared/api';
import type { QueryState } from '#shared/api';

// ─── Response Types ──────────────────────────────────────────────

interface InviteCodeDto {
  readonly id: string;
  readonly code: string;
  readonly status: 'Available' | 'Used' | 'Expired';
  readonly createdAt: string;
  readonly expiresAt: string | null;
  readonly usedBy: string | null;
  readonly usedAt: string | null;
}

interface InviteCodesResponse {
  readonly codes: readonly InviteCodeDto[];
  readonly total: number;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useInviteCodesQuery = (): QueryState<InviteCodesResponse> => {
  return useApiQuery<InviteCodesResponse>({
    queryKey: ['admin', 'invite-codes'],
    queryFn: () => apiClient.get<InviteCodesResponse>('/admin/invite-codes'),
  });
};
