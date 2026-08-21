// ═══════════════════════════════════════════════════════════════════
// User Settings Page — Composes all settings sections
// ═══════════════════════════════════════════════════════════════════

import {
  DangerSection,
  PreferencesSection,
  ProfileSection,
  SecuritySection,
  VaultSection,
} from '#features/user-settings';

// ─── Page Component ──────────────────────────────────────────────

export const UserSettingsPage = (): React.JSX.Element => {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-lg font-semibold text-foreground">Ustawienia</h1>
      <ProfileSection />
      <SecuritySection />
      <PreferencesSection />
      <VaultSection />
      <DangerSection />
    </div>
  );
};
