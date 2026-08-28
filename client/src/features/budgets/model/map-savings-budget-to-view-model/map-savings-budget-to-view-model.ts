import { computeSavingsBalance } from '#features/budgets/model/compute-savings-balance';
import { MAX_PROGRESS } from '#features/budgets/model/constants/max-progress';
import { MIN_PROGRESS } from '#features/budgets/model/constants/min-progress';
import { PERCENTAGE_MULTIPLIER } from '#features/budgets/model/constants/percentage-multiplier';
import { getLastInflow } from '#features/budgets/model/get-last-inflow';
import type { BudgetRecord } from '#features/budgets/model/types/budget-record';
import type { PeriodHistoryRecord } from '#features/budgets/model/types/period-history-record';
import type { SavingsBudgetViewModel } from '#features/budgets/model/types/savings-budget-view-model';

export const mapSavingsBudgetToViewModel = (
  budget: BudgetRecord,
  periodHistory: readonly PeriodHistoryRecord[],
  allBudgets: readonly BudgetRecord[],
): SavingsBudgetViewModel => {
  const accumulated = computeSavingsBalance(budget.id, periodHistory);
  const goalAmount = budget.limitAmount;
  const progressPercent = goalAmount > 0
    ? Math.min(MAX_PROGRESS, Math.round((accumulated / goalAmount) * PERCENTAGE_MULTIPLIER))
    : MIN_PROGRESS;
  const lastInflow = getLastInflow(budget.id, periodHistory, allBudgets);

  return {
    id: budget.id,
    name: budget.name,
    color: budget.color,
    accumulated,
    goalAmount,
    currency: budget.limitCurrency,
    progressPercent,
    lastInflow,
  };
};
