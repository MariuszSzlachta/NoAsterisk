import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '#shared/api';

// ─── Response Type ───────────────────────────────────────────────

interface BlockUserResponse {
  readonly id: string;
  readonly blocked: boolean;
}

// ─── Result Interface ────────────────────────────────────────────

interface UseBlockUserMutationResult {
  readonly toggleBlock: (userId: string, block: boolean) => Promise<BlockUserResponse>;
  readonly isLoading: boolean;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useBlockUserMutation = (): UseBlockUserMutationResult => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ userId, block }: { userId: string; block: boolean }): Promise<BlockUserResponse> => {
      return apiClient.patch<BlockUserResponse, Record<string, unknown>>(
        `/admin/users/${userId}/block`,
        { block },
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const toggleBlock = async (userId: string, block: boolean): Promise<BlockUserResponse> => {
    return mutation.mutateAsync({ userId, block });
  };

  return { toggleBlock, isLoading: mutation.isPending };
};
