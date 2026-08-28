import { endOfDay, endOfMonth, endOfYear, parseISO, startOfMonth, startOfYear } from 'date-fns';

import type { BudgetPeriodRecord } from '#features/budgets/model/types/budget-period-record';

export const getPeriodRange = (
  period: BudgetPeriodRecord,
  now: Date,
): { from: Date; to: Date } => {
  switch (period.type) {
    case 'monthly':
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case 'yearly':
      return { from: startOfYear(now), to: endOfYear(now) };
    case 'custom':
      return { from: parseISO(period.dateFrom), to: endOfDay(parseISO(period.dateTo)) };
  }
};
