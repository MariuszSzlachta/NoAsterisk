import type { PreferencesValues } from '#features/user-settings/model/types/preferences-values';

export interface UsePreferencesSectionResult {
  readonly preferences: PreferencesValues;
  readonly draft: PreferencesValues;
  readonly isDirty: boolean;
  readonly handleDraftChange: (field: keyof PreferencesValues, value: string) => void;
  readonly handleSave: () => void;
  readonly handleCancel: () => void;
}
