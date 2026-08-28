import { addDays, differenceInDays, format, parseISO } from 'date-fns';

import type { BudgetPeriodRecord } from '#features/budgets/model/types/budget-period-record';

import { DATE_FORMAT_ISO } from '#features/budgets/model/compute-next-period/constants/date-format-iso';

/** monthly/yearly: preserved as-is (auto-advance via getPeriodRange). custom: next period starts day after current end, same duration */
export const computeNextPeriod = (currentPeriod: BudgetPeriodRecord): BudgetPeriodRecord => {
  switch (currentPeriod.type) {
    case 'monthly':
      return { type: 'monthly' };
    case 'yearly':
      return { type: 'yearly' };
    case 'custom': {
      const from = parseISO(currentPeriod.dateFrom);
      const to = parseISO(currentPeriod.dateTo);
      const durationDays = differenceInDays(to, from);
      const nextFrom = addDays(to, 1);
      const nextTo = addDays(nextFrom, durationDays);
      return { type: 'custom', dateFrom: format(nextFrom, DATE_FORMAT_ISO), dateTo: format(nextTo, DATE_FORMAT_ISO) };
    }
  }
};
