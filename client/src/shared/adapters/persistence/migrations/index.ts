export { LEGACY_SOURCES } from '#shared/adapters/persistence/migrations/legacy-sources';
export { migrateLegacyLocalStorage } from '#shared/adapters/persistence/migrations/legacy-local-storage';
export type { LegacyMigrationResult } from '#shared/adapters/persistence/migrations/legacy-types';
export { isBudgetRecord } from '#shared/adapters/persistence/migrations/legacy-validators/is-budget-record';
export { isCategoryInfo } from '#shared/adapters/persistence/migrations/legacy-validators/is-category-info';
export { isImportProfileRecord } from '#shared/adapters/persistence/migrations/legacy-validators/is-import-profile-record';
export { isPeriodHistoryRecord } from '#shared/adapters/persistence/migrations/legacy-validators/is-period-history-record';
export { isRuleRecord } from '#shared/adapters/persistence/migrations/legacy-validators/is-rule-record';
export { isStoredTransaction } from '#shared/adapters/persistence/migrations/legacy-validators/is-stored-transaction';
