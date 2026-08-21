// ═══════════════════════════════════════════════════════════════════
// User Settings Feature — Preferences Store
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { PreferencesValues } from '#features/user-settings/model/types';

// ─── State Interface ─────────────────────────────────────────────

interface PreferencesState extends PreferencesValues {
  readonly setCurrency: (value: string) => void;
  readonly setDateFormat: (value: string) => void;
  readonly setLanguage: (value: string) => void;
  readonly setTheme: (value: string) => void;
  readonly setHomePage: (value: string) => void;
  readonly hydrate: (prefs: Partial<PreferencesValues>) => void;
}

// ─── Defaults ────────────────────────────────────────────────────

const DEFAULT_PREFERENCES: PreferencesValues = {
  currency: 'PLN',
  dateFormat: 'DD.MM.YYYY',
  language: 'pl',
  theme: 'dark',
  homePage: 'dashboard',
};

// ─── Store ───────────────────────────────────────────────────────

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,

      setCurrency: (value) => set({ currency: value }),
      setDateFormat: (value) => set({ dateFormat: value }),
      setLanguage: (value) => set({ language: value }),
      setTheme: (value) => set({ theme: value }),
      setHomePage: (value) => set({ homePage: value }),

      hydrate: (prefs) =>
        set((state) => ({
          currency: prefs.currency ?? state.currency,
          dateFormat: prefs.dateFormat ?? state.dateFormat,
          language: prefs.language ?? state.language,
          theme: prefs.theme ?? state.theme,
          homePage: prefs.homePage ?? state.homePage,
        })),
    }),
    {
      name: 'budget-preferences',
    },
  ),
);
