// ═══════════════════════════════════════════════════════════════════
// User Settings Page — Composes all settings sections
// ═══════════════════════════════════════════════════════════════════

import { useTranslation } from 'react-i18next';

import {
  DangerSection,
  PreferencesSection,
  ProfileSection,
  SecuritySection,
  VaultSection,
} from '#features/user-settings';

// ─── Page Component ──────────────────────────────────────────────

export const UserSettingsPage = (): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="mx-auto grid w-full max-w-2xl auto-rows-min gap-6 px-4 py-6">
      <h1 className="text-lg font-semibold text-foreground">{t('settings.title')}</h1>
      <ProfileSection />
      <SecuritySection />
      <PreferencesSection />
      <VaultSection />
      <DangerSection />
    </div>
  );
};
