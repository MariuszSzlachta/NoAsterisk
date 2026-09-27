import { useBudgetsStore } from '#features/budgets/store';
import type { BudgetDto } from '#features/dashboard-widgets/model/types';
import { useTransactionsStore } from '#model/transaction';
import type { QueryState } from '#shared/api';

export type { BudgetDto };

// ARCH-EXCEPTION: cross-feature import — read-only access to useBudgetsStore + useTransactionsStore
// public APIs. Planned resolution: migrate to TanStack Query when backend provides aggregation endpoints.

export const useBudgetQuery = (): QueryState<BudgetDto[]> => {
  const budgets = useBudgetsStore((s) => s.budgets);
  const transactions = useTransactionsStore((s) => s.transactions);

  // DEBUG: remove after fixing budget widget issue
  console.log('[BudgetWidget] store budgets:', budgets.length, budgets.map(b => ({ id: b.id?.slice(0, 8), name: b.name, type: b.budgetType, archived: b.isArchived })));

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
