import type { MutationState } from '#features/user-settings/api/useUpdatePreferencesMutation/mutation-state';
import type { PreferencesValues } from '#features/user-settings/model/types/preferences-values';

export interface UseUpdatePreferencesMutationResult {
  readonly state: MutationState;
  readonly mutateAsync: (body: Partial<PreferencesValues>) => Promise<boolean>;
  readonly reset: () => void;
}
