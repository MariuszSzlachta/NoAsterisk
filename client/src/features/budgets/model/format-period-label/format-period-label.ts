import { format } from 'date-fns';

import { PERIOD_FROM_FORMAT } from '#features/budgets/model/format-period-label/constants/period-from-format';
import { PERIOD_TO_FORMAT } from '#features/budgets/model/format-period-label/constants/period-to-format';

export const formatPeriodLabel = (from: Date, to: Date): string => {
  const fromStr = format(from, PERIOD_FROM_FORMAT);
  const toStr = format(to, PERIOD_TO_FORMAT);
  return `${fromStr}–${toStr}`;
};
