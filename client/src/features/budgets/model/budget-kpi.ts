import type { BudgetKpiVM, BudgetViewModel } from './types';

/**
 * Computes aggregate KPI stats from a list of budget view models.
 * Used by the KPI row at the top of BudgetsPage.
 */
export const computeBudgetKpis = (budgets: readonly BudgetViewModel[]): BudgetKpiVM => {
  const currency = budgets[0]?.currency ?? 'PLN';

  const totalPlanned = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalPlanned - totalSpent;
  const needsAttentionCount = budgets.filter(
    (b) => b.status === 'overBudget' || b.status === 'warning',
  ).length;

  return {
    totalPlanned,
    totalSpent,
    totalRemaining,
    needsAttentionCount,
    currency,
  };
};
