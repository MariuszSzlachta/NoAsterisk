import type { BudgetStatus } from '#features/budgets/model/types/budget-status';

import { SURPLUS_SPENDING_THRESHOLD } from '#features/budgets/model/compute-budget-status/constants/surplus-spending-threshold';
import { SURPLUS_TIME_THRESHOLD } from '#features/budgets/model/compute-budget-status/constants/surplus-time-threshold';
import { WARNING_SPENDING_THRESHOLD } from '#features/budgets/model/compute-budget-status/constants/warning-spending-threshold';

/** Priority order: awaitingClosure > newPeriod > overBudget > warning > surplus > onTrack (ADR-009 D4) */
export const computeBudgetStatus = (
  spent: number,
  limit: number,
  daysElapsed: number,
  totalDays: number,
  totalTransactions: number,
  periodEnded: boolean,
): BudgetStatus => {
  if (periodEnded) {
    return 'awaitingClosure';
  }

  if (totalTransactions === 0) {
    return 'newPeriod';
  }

  if (spent > limit) {
    return 'overBudget';
  }

  const spentRatio = limit > 0 ? spent / limit : 0;
  const timeRatio = totalDays > 0 ? daysElapsed / totalDays : 0;

  if (spentRatio > timeRatio && spentRatio > WARNING_SPENDING_THRESHOLD) {
    return 'warning';
  }

  if (spentRatio < SURPLUS_SPENDING_THRESHOLD && timeRatio > SURPLUS_TIME_THRESHOLD) {
    return 'surplus';
  }

  return 'onTrack';
};
