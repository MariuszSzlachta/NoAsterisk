import type { PreferencesValues } from '#features/user-settings/model/types/preferences-values';
import type { ProfileData } from '#features/user-settings/model/types/profile-data';

export interface ProfileResponse extends ProfileData {
  readonly preferences: PreferencesValues;
}
