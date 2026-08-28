import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '#shared/api';

import { ADMIN_USERS_PATH } from '#features/admin/api/constants/admin-users-path';
import { ADMIN_USERS_QUERY_KEY } from '#features/admin/api/constants/admin-users-query-key';
import { getErrorMessage } from '#features/admin/api/constants/get-error-message';
import type { BlockUserParams } from '#features/admin/api/useBlockUserMutation/block-user-params';
import type { BlockUserRequest } from '#features/admin/api/useBlockUserMutation/block-user-request';
import type { BlockUserResponse } from '#features/admin/api/useBlockUserMutation/block-user-response';
import type { UseBlockUserMutationResult } from '#features/admin/api/useBlockUserMutation/use-block-user-mutation-result';

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

  return { toggleBlock, isLoading: mutation.isPending, error: getErrorMessage(mutation.error) };
};
