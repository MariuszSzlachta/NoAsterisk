// User Settings — PreferencesSection Component

import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { usePreferencesSection } from '#features/user-settings/ui/hooks/usePreferencesSection';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';

import { CURRENCY_OPTIONS } from '#features/user-settings/ui/PreferencesSection/constants/currency-options';
import { DATE_FORMAT_OPTIONS } from '#features/user-settings/ui/PreferencesSection/constants/date-format-options';
import { HOME_PAGE_OPTIONS } from '#features/user-settings/ui/PreferencesSection/constants/home-page-options';
import { LANGUAGE_OPTIONS } from '#features/user-settings/ui/PreferencesSection/constants/language-options';
import { THEME_OPTIONS } from '#features/user-settings/ui/PreferencesSection/constants/theme-options';
import { PrefRow } from '#features/user-settings/ui/PreferencesSection/PrefRow';

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
