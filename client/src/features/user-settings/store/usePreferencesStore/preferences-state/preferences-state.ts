import type { PreferencesValues } from '#features/user-settings/model/types/preferences-values';

export interface PreferencesState extends PreferencesValues {
  readonly setCurrency: (value: string) => void;
  readonly setDateFormat: (value: string) => void;
  readonly setLanguage: (value: string) => void;
  readonly setTheme: (value: string) => void;
  readonly setHomePage: (value: string) => void;
  readonly hydrate: (prefs: Partial<PreferencesValues>) => void;
}
