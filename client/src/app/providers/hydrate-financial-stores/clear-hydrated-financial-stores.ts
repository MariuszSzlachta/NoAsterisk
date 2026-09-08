import { useRulesStore } from '#features/admin-rules/store/useRulesStore';
import { useBudgetsStore } from '#features/budgets/store/useBudgetsStore';
import { usePeriodHistoryStore } from '#features/budgets/store/usePeriodHistoryStore';
import { useImportHistoryStore } from '#features/csv-import/store/useImportHistoryStore';
import { useTransactionsStore } from '#features/transactions/store/useTransactionsStore';
import { useCategoriesStore } from '#entities/category';

export const clearHydratedFinancialStores = (): void => {
  useTransactionsStore.setState({ transactions: [] });
  useRulesStore.setState({ rules: [] });
  useBudgetsStore.setState({ budgets: [] });
  usePeriodHistoryStore.setState({ history: [] });
  useCategoriesStore.setState({ categories: [] });
  useImportHistoryStore.setState({ history: [] });
};
