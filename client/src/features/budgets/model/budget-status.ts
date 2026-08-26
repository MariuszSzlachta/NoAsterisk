import type { BudgetStatus } from './types';

// ─── Status Policy Thresholds ────────────────────────────────────

/** Spending ratio above which a budget enters "warning" state */
const WARNING_SPENDING_THRESHOLD = 0.7;

/** Spending ratio below which a budget is considered "surplus" */
const SURPLUS_SPENDING_THRESHOLD = 0.5;

/** Time ratio above which surplus comparison applies */
const SURPLUS_TIME_THRESHOLD = 0.5;

// ─── Status Computation ──────────────────────────────────────────

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
