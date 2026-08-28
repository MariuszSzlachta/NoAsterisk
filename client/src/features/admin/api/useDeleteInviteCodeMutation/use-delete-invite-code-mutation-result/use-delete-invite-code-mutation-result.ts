import type { DeleteInviteCodeResponse } from '#features/admin/api/useDeleteInviteCodeMutation/delete-invite-code-response';

export interface UseDeleteInviteCodeMutationResult {
  readonly deleteCode: (codeId: string) => Promise<DeleteInviteCodeResponse>;
  readonly isLoading: boolean;
  readonly error: string | undefined;
}
