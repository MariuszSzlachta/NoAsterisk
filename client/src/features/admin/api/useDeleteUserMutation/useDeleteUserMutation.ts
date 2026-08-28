import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '#shared/api';

import { ADMIN_USERS_PATH } from '#features/admin/api/constants/admin-users-path';
import { ADMIN_USERS_QUERY_KEY } from '#features/admin/api/constants/admin-users-query-key';
import { getErrorMessage } from '#features/admin/api/constants/get-error-message';
import type { DeleteUserResponse } from '#features/admin/api/useDeleteUserMutation/delete-user-response';
import type { UseDeleteUserMutationResult } from '#features/admin/api/useDeleteUserMutation/use-delete-user-mutation-result';

export const useDeleteUserMutation = (): UseDeleteUserMutationResult => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (userId: string): Promise<DeleteUserResponse> =>
      apiClient.delete<DeleteUserResponse>(`${ADMIN_USERS_PATH}/${userId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...ADMIN_USERS_QUERY_KEY] });
    },
  });

  const deleteUser = (userId: string): Promise<DeleteUserResponse> =>
    mutation.mutateAsync(userId);

  return { deleteUser, isLoading: mutation.isPending, error: getErrorMessage(mutation.error) };
};
