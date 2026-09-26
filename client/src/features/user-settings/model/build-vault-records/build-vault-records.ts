import type { VaultRecords } from '#features/user-settings/model/vault-payload';
import { useBudgetsStore, usePeriodHistoryStore } from '#entities/budget';
import { useCategoriesStore } from '#entities/category';
import { useImportHistoryStore } from '#entities/import-batch';
import { useRulesStore } from '#entities/rule';
import { useTransactionsStore } from '#entities/transaction';

export const buildVaultRecords = (): VaultRecords => ({
  transactions: useTransactionsStore.getState().transactions,
  rules: useRulesStore.getState().rules,
  categories: useCategoriesStore.getState().categories,
  budgets: useBudgetsStore.getState().budgets,
  periodHistory: usePeriodHistoryStore.getState().history,
  importHistory: useImportHistoryStore.getState().history,
});
