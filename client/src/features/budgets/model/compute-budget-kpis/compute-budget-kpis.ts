import type { BudgetKpiVM } from '#features/budgets/model/types/budget-kpi-vm';
import type { BudgetViewModel } from '#features/budgets/model/types/budget-view-model';

export const computeBudgetKpis = (
  budgets: readonly BudgetViewModel[],
  defaultCurrency: string,
): BudgetKpiVM => {
  if (budgets.length === 0) {
    return {
      totalPlanned: 0,
      totalSpent: 0,
      totalRemaining: 0,
      needsAttentionCount: 0,
      currency: defaultCurrency,
    };
  }

  const firstBudget = budgets[0];
  if (!firstBudget) {
    return {
      totalPlanned: 0,
      totalSpent: 0,
      totalRemaining: 0,
      needsAttentionCount: 0,
      currency: defaultCurrency,
    };
  }

  const currency = firstBudget.currency;
  const hasMixedCurrencies = budgets.some((b) => b.currency !== currency);

  if (hasMixedCurrencies) {
    throw new Error(
      `computeBudgetKpis: mixed currencies detected. All budgets must have the same currency for aggregation. ` +
      `Found "${currency}" and others. Pre-filter by currency before calling.`,
    );
  }

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
