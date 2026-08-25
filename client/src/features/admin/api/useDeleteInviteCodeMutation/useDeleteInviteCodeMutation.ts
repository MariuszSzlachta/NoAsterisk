import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '#shared/api';

// ─── Constants ───────────────────────────────────────────────────

const INVITE_CODES_PATH = '/admin/invite-codes' as const;
const INVITE_CODES_QUERY_KEY = ['admin', 'invite-codes'] as const;

// ─── Response Type ───────────────────────────────────────────────

interface DeleteInviteCodeResponse {
  readonly id: string;
  readonly deleted: boolean;
}

// ─── Result Interface ────────────────────────────────────────────

interface UseDeleteInviteCodeMutationResult {
  readonly deleteCode: (codeId: string) => Promise<DeleteInviteCodeResponse>;
  readonly isLoading: boolean;
  readonly error: string | undefined;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useDeleteInviteCodeMutation = (): UseDeleteInviteCodeMutationResult => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (codeId: string): Promise<DeleteInviteCodeResponse> =>
      apiClient.delete<DeleteInviteCodeResponse>(`${INVITE_CODES_PATH}/${codeId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...INVITE_CODES_QUERY_KEY] });
    },
  });

  const deleteCode = (codeId: string): Promise<DeleteInviteCodeResponse> =>
    mutation.mutateAsync(codeId);

  const error = mutation.error ? (mutation.error as Error).message : undefined;

  return { deleteCode, isLoading: mutation.isPending, error };
};
