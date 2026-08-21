export interface UserPreferences {
  readonly currency: 'PLN' | 'EUR' | 'USD' | 'GBP';
  readonly dateFormat: 'DD.MM.YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
  readonly language: 'pl' | 'en';
  readonly theme: 'dark' | 'light' | 'system';
  readonly homePage: 'dashboard' | 'transactions' | 'import';
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  currency: 'PLN',
  dateFormat: 'DD.MM.YYYY',
  language: 'pl',
  theme: 'dark',
  homePage: 'dashboard',
};
