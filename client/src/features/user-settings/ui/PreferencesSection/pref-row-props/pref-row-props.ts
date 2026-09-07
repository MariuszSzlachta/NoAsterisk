import type { PreferencesValues } from '#features/user-settings/model/types/preferences-values';
import type { SelectOption } from '#shared/ui/Select/Select';

export interface PrefRowProps {
  readonly label: string;
  readonly description: string;
  readonly options: readonly SelectOption[];
  readonly value: string;
  readonly storeValue: string;
  readonly field: keyof PreferencesValues;
  readonly unsavedLabel: string;
  readonly onChange: (field: keyof PreferencesValues, value: string) => void;
}
