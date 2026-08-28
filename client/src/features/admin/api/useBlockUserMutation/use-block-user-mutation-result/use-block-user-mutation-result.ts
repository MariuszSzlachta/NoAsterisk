import type { BlockUserResponse } from '#features/admin/api/useBlockUserMutation/block-user-response';

export interface UseBlockUserMutationResult {
  readonly toggleBlock: (userId: string, block: boolean) => Promise<BlockUserResponse>;
  readonly isLoading: boolean;
  readonly error: string | undefined;
}
