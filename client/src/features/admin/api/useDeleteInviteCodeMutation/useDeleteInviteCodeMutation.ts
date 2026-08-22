import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '#shared/api';

// ─── Response Type ───────────────────────────────────────────────

interface DeleteInviteCodeResponse {
  readonly id: string;
  readonly deleted: boolean;
}

// ─── Result Interface ────────────────────────────────────────────

interface UseDeleteInviteCodeMutationResult {
  readonly deleteCode: (codeId: string) => Promise<DeleteInviteCodeResponse>;
  readonly isLoading: boolean;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useDeleteInviteCodeMutation = (): UseDeleteInviteCodeMutationResult => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (codeId: string): Promise<DeleteInviteCodeResponse> => {
      return apiClient.delete<DeleteInviteCodeResponse>(`/admin/invite-codes/${codeId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'invite-codes'] });
    },
  });

  const deleteCode = async (codeId: string): Promise<DeleteInviteCodeResponse> => {
    return mutation.mutateAsync(codeId);
  };

  return { deleteCode, isLoading: mutation.isPending };
};
