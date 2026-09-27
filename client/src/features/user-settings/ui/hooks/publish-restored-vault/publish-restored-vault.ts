import type { RestorableVaultPayload } from '#features/user-settings/model/vault-payload';
import { useBudgetsStore, usePeriodHistoryStore } from '#features/budgets/store';
import { useCategoriesStore } from '#model/category';
import { useImportHistoryStore } from '#features/csv-import/store/useImportHistoryStore';
import { useRulesStore } from '#model/rule';
import { useTransactionsStore } from '#model/transaction';

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
