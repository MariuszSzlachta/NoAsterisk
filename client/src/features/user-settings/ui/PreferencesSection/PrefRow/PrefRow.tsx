import { useTranslation } from 'react-i18next';

import { Select } from '#shared/ui/Select';

import type { PrefRowProps } from '#features/user-settings/ui/PreferencesSection/pref-row-props';

export const PrefRow = ({ label, description, options, value, storeValue, field, unsavedLabel, onChange }: PrefRowProps): React.JSX.Element => {
  const { t: _t } = useTranslation();

  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0">
      <div className="mr-4 min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <div className="flex items-center gap-2">
        {value !== storeValue && (
          <div className="h-2 w-2 rounded-full bg-warning" aria-label={unsavedLabel} />
        )}
        <div className="w-40">
          <Select
            options={options}
            value={value}
            onChange={(v) => onChange(field, v)}
            showDot={value !== storeValue}
          />
        </div>
      </div>
    </div>
  );
};
