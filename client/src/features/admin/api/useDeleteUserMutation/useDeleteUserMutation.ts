import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '#shared/api';

// ─── Response Type ───────────────────────────────────────────────

interface DeleteUserResponse {
  readonly id: string;
  readonly deleted: boolean;
}

// ─── Result Interface ────────────────────────────────────────────

interface UseDeleteUserMutationResult {
  readonly deleteUser: (userId: string) => Promise<DeleteUserResponse>;
  readonly isLoading: boolean;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useDeleteUserMutation = (): UseDeleteUserMutationResult => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (userId: string): Promise<DeleteUserResponse> => {
      return apiClient.delete<DeleteUserResponse>(`/admin/users/${userId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const deleteUser = async (userId: string): Promise<DeleteUserResponse> => {
    return mutation.mutateAsync(userId);
  };

  return { deleteUser, isLoading: mutation.isPending };
};
