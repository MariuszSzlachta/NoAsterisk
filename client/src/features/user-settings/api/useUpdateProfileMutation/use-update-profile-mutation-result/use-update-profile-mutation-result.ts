import type { MutationState } from '#features/user-settings/api/useUpdateProfileMutation/mutation-state';
import type { UpdateProfileBody } from '#features/user-settings/api/useUpdateProfileMutation/update-profile-body';

export interface UseUpdateProfileMutationResult {
  readonly state: MutationState;
  readonly mutateAsync: (body: UpdateProfileBody) => Promise<boolean>;
  readonly reset: () => void;
}
