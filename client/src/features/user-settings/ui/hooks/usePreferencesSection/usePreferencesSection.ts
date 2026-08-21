// ═══════════════════════════════════════════════════════════════════
// User Settings — usePreferencesSection Hook
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';

import { useUpdatePreferencesMutation } from '#features/user-settings/api/useUpdatePreferencesMutation';
import type { PreferencesValues } from '#features/user-settings/model/types';
import { usePreferencesStore } from '#features/user-settings/store/usePreferencesStore';

// ─── Result Interface ────────────────────────────────────────────

interface UsePreferencesSectionResult {
  readonly preferences: PreferencesValues;
  readonly draft: PreferencesValues;
  readonly isDirty: boolean;
  readonly handleDraftChange: (field: keyof PreferencesValues, value: string) => void;
  readonly handleSave: () => void;
  readonly handleCancel: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const usePreferencesSection = (): UsePreferencesSectionResult => {
  const currency = usePreferencesStore((s) => s.currency);
  const dateFormat = usePreferencesStore((s) => s.dateFormat);
  const language = usePreferencesStore((s) => s.language);
  const theme = usePreferencesStore((s) => s.theme);
  const homePage = usePreferencesStore((s) => s.homePage);

  const setCurrency = usePreferencesStore((s) => s.setCurrency);
  const setDateFormat = usePreferencesStore((s) => s.setDateFormat);
  const setLanguage = usePreferencesStore((s) => s.setLanguage);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const setHomePage = usePreferencesStore((s) => s.setHomePage);

  const { mutateAsync } = useUpdatePreferencesMutation();

  const storeValues: PreferencesValues = { currency, dateFormat, language, theme, homePage };

  const [draft, setDraft] = useState<PreferencesValues>(storeValues);

  const isDirty =
    draft.currency !== currency ||
    draft.dateFormat !== dateFormat ||
    draft.language !== language ||
    draft.theme !== theme ||
    draft.homePage !== homePage;

  const handleDraftChange = (field: keyof PreferencesValues, value: string): void => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (): void => {
    setCurrency(draft.currency);
    setDateFormat(draft.dateFormat);
    setLanguage(draft.language);
    setTheme(draft.theme);
    setHomePage(draft.homePage);

    // Fire-and-forget background sync to backend
    void mutateAsync(draft);
  };

  const handleCancel = (): void => {
    setDraft(storeValues);
  };

  return {
    preferences: storeValues,
    draft,
    isDirty,
    handleDraftChange,
    handleSave,
    handleCancel,
  };
};
