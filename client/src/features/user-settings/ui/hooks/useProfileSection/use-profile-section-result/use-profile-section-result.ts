import type { DisplayNameError } from '#features/user-settings/model/validate-display-name/display-name-error';
import type { ProfileData } from '#features/user-settings/model/types/profile-data';

export interface UseProfileSectionResult {
  readonly profile: ProfileData | undefined;
  readonly isLoading: boolean;
  readonly editedName: string;
  readonly nameError: DisplayNameError | undefined;
  readonly isDirty: boolean;
  readonly isSaving: boolean;
  readonly handleNameChange: (value: string) => void;
  readonly handleSave: () => Promise<boolean>;
  readonly handleCancel: () => void;
}
