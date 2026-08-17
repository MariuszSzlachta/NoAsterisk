import { DomainError } from '#domain/shared/domain-error';

export type BudgetPeriod =
  | { readonly type: 'monthly' }
  | { readonly type: 'yearly' }
  | { readonly type: 'custom'; readonly dateFrom: Date; readonly dateTo: Date };

export const validateBudgetPeriod = (period: BudgetPeriod): void => {
  if (period.type === 'custom') {
    if (period.dateFrom >= period.dateTo) {
      throw new DomainError('Budget custom period dateFrom must be before dateTo');
    }
  }
};

export const getCurrentRange = (
  period: BudgetPeriod,
  now: Date,
): { from: Date; to: Date } => {
  switch (period.type) {
    case 'monthly': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { from, to };
    }
    case 'yearly': {
      const from = new Date(now.getFullYear(), 0, 1);
      const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { from, to };
    }
    case 'custom': {
      return { from: period.dateFrom, to: period.dateTo };
    }
  }
};

export const getDaysRemaining = (period: BudgetPeriod, now: Date): number => {
  const { to } = getCurrentRange(period, now);
  const diffMs = to.getTime() - now.getTime();
  if (diffMs <= 0) {
    return 0;
  }
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Calculates the total number of days in the budget period.
 * For custom periods, dateFrom and dateTo are expected at day boundaries (midnight).
 */
export const getTotalDays = (period: BudgetPeriod, now: Date): number => {
  const { from, to } = getCurrentRange(period, now);
  const diffMs = to.getTime() - from.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const getDaysElapsed = (period: BudgetPeriod, now: Date): number => {
  const { from } = getCurrentRange(period, now);
  const diffMs = now.getTime() - from.getTime();
  if (diffMs <= 0) {
    return 0;
  }
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};
