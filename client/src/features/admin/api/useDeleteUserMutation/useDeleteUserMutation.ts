import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '#shared/api';

// ─── Constants ───────────────────────────────────────────────────

const ADMIN_USERS_PATH = '/admin/users' as const;
const ADMIN_USERS_QUERY_KEY = ['admin', 'users'] as const;

// ─── Response Type ───────────────────────────────────────────────

interface DeleteUserResponse {
  readonly id: string;
  readonly deleted: boolean;
}

// ─── Result Interface ────────────────────────────────────────────

interface UseDeleteUserMutationResult {
  readonly deleteUser: (userId: string) => Promise<DeleteUserResponse>;
  readonly isLoading: boolean;
  readonly error: string | undefined;
}

// ─── Hook ────────────────────────────────────────────────────────

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

  const error = mutation.error ? (mutation.error as Error).message : undefined;

  return { deleteUser, isLoading: mutation.isPending, error };
};
