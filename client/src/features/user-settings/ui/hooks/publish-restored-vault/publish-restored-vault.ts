import type { RestorableVaultPayload } from '#features/user-settings/model/vault-payload';
import { useBudgetsStore, usePeriodHistoryStore } from '#entities/budget';
import { useCategoriesStore } from '#entities/category';
import { useImportHistoryStore } from '#entities/import-batch';
import { useRulesStore } from '#entities/rule';
import { useTransactionsStore } from '#entities/transaction';

export const publishRestoredVault = (payload: RestorableVaultPayload): void => {
  useTransactionsStore.setState({ transactions: payload.transactions });
  useRulesStore.setState({ rules: payload.rules });
  if (payload.schemaVersion === 1) {
    useCategoriesStore.setState({ categories: payload.categories });
    useBudgetsStore.setState({ budgets: payload.budgets });
    usePeriodHistoryStore.setState({ history: payload.periodHistory });
    useImportHistoryStore.getState().setHistory(payload.importHistory);
  }
};
