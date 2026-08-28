import type { ChangePasswordBody } from '#features/user-settings/api/useChangePasswordMutation/change-password-body';
import type { MutationState } from '#features/user-settings/api/useChangePasswordMutation/mutation-state';

export interface UseChangePasswordMutationResult {
  readonly state: MutationState;
  readonly mutateAsync: (body: ChangePasswordBody) => Promise<boolean>;
  readonly reset: () => void;
}
