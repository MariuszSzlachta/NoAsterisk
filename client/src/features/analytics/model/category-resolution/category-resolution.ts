// ARCH-EXCEPTION: hardcoded category labels — placeholder until categories feature provides
// a shared lookup. Same stubs used in useTransactionsPageWiring. Will be replaced by
// a shared categories store (tracked in BUD-CATEGORIES).

/** Category ID → i18n key mapping. UI passes t(key) to resolve the display label. */
export const CATEGORY_I18N_KEYS: Record<string, string> = {
  'cat-groceries': 'categories.groceries',
  'cat-transport': 'categories.transport',
  'cat-subscriptions': 'categories.subscriptions',
  'cat-housing': 'categories.housing',
  'cat-salary': 'categories.salary',
  'cat-entertainment': 'categories.entertainment',
  'cat-health': 'categories.health',
  'cat-other': 'categories.other',
};

const UNCATEGORIZED_KEY = 'categories.uncategorized';

/**
 * Resolves a category ID to its i18n key.
 * Returns the key (not the translated label) — caller should pass through t().
 */
export const getCategoryI18nKey = (categoryId: string | undefined): string =>
  categoryId ? (CATEGORY_I18N_KEYS[categoryId] ?? categoryId) : UNCATEGORIZED_KEY;

/**
 * Legacy: resolves category ID to a Polish label directly.
 * @deprecated Use getCategoryI18nKey + t() instead. Kept for backward compat during migration.
 */
export const CATEGORY_LABELS: Record<string, string> = {
  'cat-groceries': 'Spożywcze',
  'cat-transport': 'Transport',
  'cat-subscriptions': 'Subskrypcje',
  'cat-housing': 'Mieszkanie',
  'cat-salary': 'Wynagrodzenie',
  'cat-entertainment': 'Rozrywka',
  'cat-health': 'Zdrowie',
  'cat-other': 'Inne',
};

const UNCATEGORIZED_LABEL = 'Bez kategorii';

/** @deprecated Use getCategoryI18nKey + t() instead. */
export const getCategoryLabel = (categoryId: string | undefined): string =>
  categoryId ? (CATEGORY_LABELS[categoryId] ?? categoryId) : UNCATEGORIZED_LABEL;
