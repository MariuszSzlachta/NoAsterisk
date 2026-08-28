import type { DeleteAccountBody } from '#features/user-settings/api/useDeleteAccountMutation/delete-account-body';
import type { MutationState } from '#features/user-settings/api/useDeleteAccountMutation/mutation-state';

export interface UseDeleteAccountMutationResult {
  readonly state: MutationState;
  readonly mutateAsync: (body: DeleteAccountBody) => Promise<boolean>;
  readonly reset: () => void;
}
