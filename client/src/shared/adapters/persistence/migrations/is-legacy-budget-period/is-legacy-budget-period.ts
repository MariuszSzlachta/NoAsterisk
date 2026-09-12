import type { BudgetPeriodRecord } from '#features/budgets/model/types/budget-period-record';
import { isRecord } from '#shared/lib/is-record';
import { recordGuards } from '#shared/lib/record-guards';

export const isLegacyBudgetPeriod = (
  value: unknown,
): value is BudgetPeriodRecord => {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false;
  }
  if (value.type === 'monthly' || value.type === 'yearly') {
    return Object.keys(value).every((key) => key === 'type');
  }
  return (
    value.type === 'custom' &&
    recordGuards.hasString(value, 'dateFrom') &&
    recordGuards.hasString(value, 'dateTo') &&
    Object.keys(value).every((key) =>
      ['type', 'dateFrom', 'dateTo'].includes(key),
    )
  );
};
