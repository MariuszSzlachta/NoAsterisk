import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { DEFAULT_PREFERENCES } from '#features/user-settings/store/usePreferencesStore/default-preferences';
import type { PreferencesState } from '#features/user-settings/store/usePreferencesStore/preferences-state';

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
