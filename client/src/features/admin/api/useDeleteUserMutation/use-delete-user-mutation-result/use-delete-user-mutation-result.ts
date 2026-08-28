import type { DeleteUserResponse } from '#features/admin/api/useDeleteUserMutation/delete-user-response';

export interface UseDeleteUserMutationResult {
  readonly deleteUser: (userId: string) => Promise<DeleteUserResponse>;
  readonly isLoading: boolean;
  readonly error: string | undefined;
}
