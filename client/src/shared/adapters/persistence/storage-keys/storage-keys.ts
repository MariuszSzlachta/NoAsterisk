const LEGACY_STORAGE_KEYS = {
  transactions: 'budget-transactions',
  rules: 'budget-rules',
  budgets: 'budget-budgets',
  periodHistory: 'budget-period-history',
  categories: 'budget-categories',
  importProfiles: 'budget-import-profiles',
};

const PREFERENCES_STORAGE_KEYS = {
  preferences: 'budget-preferences',
  theme: 'budget-theme',
};

export const PERSISTENCE_STORAGE_KEYS = {
  legacy: LEGACY_STORAGE_KEYS,
  preferences: PREFERENCES_STORAGE_KEYS,
};
