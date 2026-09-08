import { PERSISTENCE_STORAGE_KEYS } from '#shared/adapters/persistence/storage-keys';
import { isBudgetRecord } from '#shared/adapters/persistence/migrations/legacy-validators/is-budget-record';
import { isCategoryInfo } from '#shared/adapters/persistence/migrations/legacy-validators/is-category-info';
import { isImportProfileRecord } from '#shared/adapters/persistence/migrations/legacy-validators/is-import-profile-record';
import { isPeriodHistoryRecord } from '#shared/adapters/persistence/migrations/legacy-validators/is-period-history-record';
import { isRuleRecord } from '#shared/adapters/persistence/migrations/legacy-validators/is-rule-record';
import { isStoredTransaction } from '#shared/adapters/persistence/migrations/legacy-validators/is-stored-transaction';
import { TRANSACTIONS_COLLECTION } from '#shared/adapters/persistence/ports';
import type { LegacySource } from '#shared/adapters/persistence/migrations/legacy-types';

export const LEGACY_SOURCES: ReadonlyArray<LegacySource> = [
  { key: PERSISTENCE_STORAGE_KEYS.legacy.transactions, collection: TRANSACTIONS_COLLECTION, stateField: 'transactions', validator: isStoredTransaction },
  { key: PERSISTENCE_STORAGE_KEYS.legacy.rules, collection: 'rules', stateField: 'rules', validator: isRuleRecord },
  { key: PERSISTENCE_STORAGE_KEYS.legacy.budgets, collection: 'budgets', stateField: 'budgets', validator: isBudgetRecord },
  { key: PERSISTENCE_STORAGE_KEYS.legacy.periodHistory, collection: 'period-history', stateField: 'history', validator: isPeriodHistoryRecord },
  { key: PERSISTENCE_STORAGE_KEYS.legacy.categories, collection: 'categories', stateField: 'categories', validator: isCategoryInfo },
  { key: PERSISTENCE_STORAGE_KEYS.legacy.importProfiles, collection: 'import-profiles', stateField: 'profiles', validator: isImportProfileRecord },
];
