import type { VaultRecords } from '#features/user-settings/model/vault-payload';
import { useBudgetsStore, usePeriodHistoryStore } from '#features/budgets/store';
import { useCategoriesStore } from '#model/category';
import { useImportHistoryStore } from '#features/csv-import/store/useImportHistoryStore';
import { useRulesStore } from '#model/rule';
import { useTransactionsStore } from '#model/transaction';

export const buildVaultRecords = (): VaultRecords => ({
  transactions: useTransactionsStore.getState().transactions,
  rules: useRulesStore.getState().rules,
  categories: useCategoriesStore.getState().categories,
  budgets: useBudgetsStore.getState().budgets,
  periodHistory: usePeriodHistoryStore.getState().history,
  importHistory: useImportHistoryStore.getState().history,
});
