import { useBudgetsStore } from '#features/budgets/store/useBudgetsStore';
// ARCH-EXCEPTION: cross-feature import — budgets needs transaction data for spent computation.
// Transactions feature exports useTransactionsStore via its public API (index.ts).
import { useTransactionsStore } from '#features/transactions';

import { computeBudgetKpis } from '#features/budgets/model/budget-kpi';
import { mapBudgetRecordToViewModel } from '#features/budgets/model/transformers';
import type { BudgetKpiVM } from '#features/budgets/model/types';

export const useBudgetKpi = (): BudgetKpiVM => {
  const budgets = useBudgetsStore((s) => s.budgets);
  const transactions = useTransactionsStore((s) => s.transactions);

  const now = new Date();
  const activeBudgets = budgets.filter((b) => !b.isArchived);
  const viewModels = activeBudgets.map((b) => mapBudgetRecordToViewModel(b, transactions, now));

  return computeBudgetKpis(viewModels);
};
