import type { InviteCodeDto } from '#features/admin/api/useInviteCodesQuery/invite-code-dto';

export interface InviteCodesResponse {
  readonly codes: readonly InviteCodeDto[];
  readonly total: number;
}
