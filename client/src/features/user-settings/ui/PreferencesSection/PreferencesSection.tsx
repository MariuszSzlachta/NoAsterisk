// ═══════════════════════════════════════════════════════════════════
// User Settings — PreferencesSection Component
// ═══════════════════════════════════════════════════════════════════

import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { PreferencesValues } from '#features/user-settings/model/types';
import { usePreferencesSection } from '#features/user-settings/ui/hooks/usePreferencesSection';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';
import { Select } from '#shared/ui/Select';
import type { SelectOption } from '#shared/ui/Select';

// ─── Option Constants ────────────────────────────────────────────

const CURRENCY_OPTIONS: readonly SelectOption[] = [
  { value: 'PLN', label: 'PLN (zł)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'GBP', label: 'GBP (£)' },
];

const DATE_FORMAT_OPTIONS: readonly SelectOption[] = [
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
];

const LANGUAGE_OPTIONS: readonly SelectOption[] = [
  { value: 'pl', label: 'Polski' },
  { value: 'en', label: 'English' },
];

const THEME_OPTIONS: readonly SelectOption[] = [
  { value: 'dark', label: 'Ciemny' },
  { value: 'light', label: 'Jasny' },
  { value: 'system', label: 'Systemowy' },
];

const HOME_PAGE_OPTIONS: readonly SelectOption[] = [
  { value: 'dashboard', label: 'Pulpit' },
  { value: 'transactions', label: 'Transakcje' },
  { value: 'import', label: 'Import' },
];

// ─── Preference Row ──────────────────────────────────────────────

interface PrefRowProps {
  readonly label: string;
  readonly description: string;
  readonly options: readonly SelectOption[];
  readonly value: string;
  readonly storeValue: string;
  readonly field: keyof PreferencesValues;
  readonly unsavedLabel: string;
  readonly onChange: (field: keyof PreferencesValues, value: string) => void;
}

const PrefRow = ({ label, description, options, value, storeValue, field, unsavedLabel, onChange }: PrefRowProps): React.JSX.Element => (
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

// ─── Component ───────────────────────────────────────────────────

export const PreferencesSection = (): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    preferences,
    draft,
    isDirty,
    handleDraftChange,
    handleSave,
    handleCancel,
  } = usePreferencesSection();

  return (
    <Card className="">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">{t('settings.preferences.title')}</h2>
        <p className="text-xs text-muted-foreground">{t('settings.preferences.subtitle')}</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <PrefRow
          label={t('settings.preferences.currency')}
          description={t('settings.preferences.currencyDescription')}
          options={CURRENCY_OPTIONS}
          value={draft.currency}
          storeValue={preferences.currency}
          field="currency"
          unsavedLabel={t('settings.preferences.unsavedLabel')}
          onChange={handleDraftChange}
        />
        <PrefRow
          label={t('settings.preferences.dateFormat')}
          description={t('settings.preferences.dateFormatDescription')}
          options={DATE_FORMAT_OPTIONS}
          value={draft.dateFormat}
          storeValue={preferences.dateFormat}
          field="dateFormat"
          unsavedLabel={t('settings.preferences.unsavedLabel')}
          onChange={handleDraftChange}
        />
        <PrefRow
          label={t('settings.preferences.language')}
          description={t('settings.preferences.languageDescription')}
          options={LANGUAGE_OPTIONS}
          value={draft.language}
          storeValue={preferences.language}
          field="language"
          unsavedLabel={t('settings.preferences.unsavedLabel')}
          onChange={handleDraftChange}
        />
        <PrefRow
          label={t('settings.preferences.theme')}
          description={t('settings.preferences.themeDescription')}
          options={THEME_OPTIONS}
          value={draft.theme}
          storeValue={preferences.theme}
          field="theme"
          unsavedLabel={t('settings.preferences.unsavedLabel')}
          onChange={handleDraftChange}
        />
        <PrefRow
          label={t('settings.preferences.homePage')}
          description={t('settings.preferences.homePageDescription')}
          options={HOME_PAGE_OPTIONS}
          value={draft.homePage}
          storeValue={preferences.homePage}
          field="homePage"
          unsavedLabel={t('settings.preferences.unsavedLabel')}
          onChange={handleDraftChange}
        />
      </div>

      {isDirty && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-warning" aria-hidden="true" />
            <span className="text-xs font-medium text-warning">{t('settings.preferences.unsavedChanges')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              {t('settings.preferences.cancel')}
            </Button>
            <Button size="sm" onClick={handleSave}>
              {t('settings.preferences.save')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
