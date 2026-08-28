import type { MutationState } from '#features/user-settings/api/useLogoutMutation/mutation-state';

export interface UseLogoutMutationResult {
  readonly state: MutationState;
  readonly mutateAsync: () => Promise<boolean>;
  readonly reset: () => void;
}
