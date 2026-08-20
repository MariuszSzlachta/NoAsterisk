import { useBudgetsStore } from '#features/budgets';
import type { BudgetDto } from '#features/dashboard-widgets/model/types';
import { useTransactionsStore } from '#features/transactions';
import type { QueryState } from '#shared/api';

export type { BudgetDto };

// ARCH-EXCEPTION: cross-feature import — read-only access to useBudgetsStore + useTransactionsStore
// public APIs. Planned resolution: migrate to TanStack Query when backend provides aggregation endpoints.

export const useBudgetQuery = (): QueryState<BudgetDto[]> => {
  const budgets = useBudgetsStore((s) => s.budgets);
  const transactions = useTransactionsStore((s) => s.transactions);

  const data: BudgetDto[] = budgets
    .filter((b) => !b.isArchived && b.budgetType === 'standard')
    .map((budget) => {
      const assigned = transactions.filter((tx) => tx.budgetId === budget.id);
      const spent = Math.abs(
        assigned
          .filter((tx) => tx.amount < 0)
          .reduce((sum, tx) => sum + tx.amount, 0),
      );
      return {
        label: budget.name,
        spent,
        limit: budget.limitAmount,
        color: budget.color,
      };
    });

  return { status: 'loaded', data };
};
