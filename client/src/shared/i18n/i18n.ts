import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';

import en from './locales/en.json';
import pl from './locales/pl.json';

const getPersistedLanguage = (): string => {
  try {
    const stored = localStorage.getItem('budget-preferences');
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'state' in parsed &&
        typeof parsed.state === 'object' &&
        parsed.state !== null &&
        'language' in parsed.state &&
        typeof parsed.state.language === 'string'
      ) {
        return parsed.state.language;
      }
    }
  } catch {
    // Ignore parse errors — fall back to default
  }
  return 'pl';
};

i18n.use(initReactI18next).init({
  resources: {
    pl: { translation: pl },
    en: { translation: en },
  },
  lng: getPersistedLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
