import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '#shared/api';

// ─── Constants ───────────────────────────────────────────────────

const ADMIN_USERS_PATH = '/admin/users' as const;
const ADMIN_USERS_QUERY_KEY = ['admin', 'users'] as const;

// ─── Types ───────────────────────────────────────────────────────

interface BlockUserRequest {
  readonly block: boolean;
}

interface BlockUserResponse {
  readonly id: string;
  readonly blocked: boolean;
}

interface BlockUserParams {
  readonly userId: string;
  readonly block: boolean;
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
    mutationFn: ({ userId, block }: BlockUserParams): Promise<BlockUserResponse> =>
      apiClient.patch<BlockUserResponse, BlockUserRequest>(
        `${ADMIN_USERS_PATH}/${userId}/block`,
        { block },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...ADMIN_USERS_QUERY_KEY] });
    },
  });

  const toggleBlock = (userId: string, block: boolean): Promise<BlockUserResponse> =>
    mutation.mutateAsync({ userId, block });

  return { toggleBlock, isLoading: mutation.isPending };
};
