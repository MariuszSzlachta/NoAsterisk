import { useBudgetsStore } from '#features/budgets/store/useBudgetsStore';
import { usePeriodHistoryStore } from '#features/budgets/store/usePeriodHistoryStore';
// ARCH-EXCEPTION: cross-feature import — budgets needs transaction data for spent computation.
// Transactions feature exports useTransactionsStore via its public API (index.ts).
import { useTransactionsStore } from '#features/transactions';

import { computeBudgetKpis } from '#features/budgets/model/budget-kpi';
import { mapBudgetRecordToViewModel } from '#features/budgets/model/transformers';
import type { BudgetKpiVM } from '#features/budgets/model/types';

const DEFAULT_CURRENCY = 'PLN';

export const useBudgetKpi = (): BudgetKpiVM => {
  const budgets = useBudgetsStore((s) => s.budgets);
  const transactions = useTransactionsStore((s) => s.transactions);
  const periodHistory = usePeriodHistoryStore((s) => s.history);

  const now = new Date();
  const activeBudgets = budgets.filter((b) => !b.isArchived && b.budgetType !== 'savings');
  const viewModels = activeBudgets.map((b) => mapBudgetRecordToViewModel(b, transactions, now, periodHistory));

  return computeBudgetKpis(viewModels, DEFAULT_CURRENCY);
};
