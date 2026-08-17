import type { BudgetStatus } from './types';

/**
 * Computes the budget status from spending and time metrics.
 * ADR-009 Decision D4: Status is always derived, never stored.
 *
 * Priority order: awaitingClosure > newPeriod > overBudget > warning > surplus > onTrack
 */
export const computeBudgetStatus = (
  spent: number,
  limit: number,
  daysElapsed: number,
  totalDays: number,
  totalTransactions: number,
  periodEnded?: boolean,
): BudgetStatus => {
  if (periodEnded === true) {
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

  if (spentRatio > timeRatio && spentRatio > 0.7) {
    return 'warning';
  }

  if (spentRatio < 0.5 && timeRatio > 0.5) {
    return 'surplus';
  }

  return 'onTrack';
};

const STATUS_LABEL_KEYS: Record<BudgetStatus, string> = {
  awaitingClosure: 'budgets.status.awaitingClosure',
  overBudget: 'budgets.status.overBudget',
  warning: 'budgets.status.warning',
  onTrack: 'budgets.status.onTrack',
  surplus: 'budgets.status.surplus',
  newPeriod: 'budgets.status.newPeriod',
};

export const getStatusLabelKey = (status: BudgetStatus): string => STATUS_LABEL_KEYS[status];
