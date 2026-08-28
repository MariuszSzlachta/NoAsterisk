import { format } from 'date-fns';

import type { PeriodHistoryRecord } from '#features/budgets/model/types/period-history-record';

import { DATE_FORMAT_ISO } from '#features/budgets/model/has-been-closed/constants/date-format-iso';

export const hasBeenClosed = (
  budgetId: string,
  periodFrom: Date,
  periodTo: Date,
  history?: readonly PeriodHistoryRecord[],
): boolean => {
  if (!history) {
    return false;
  }
  const fromStr = format(periodFrom, DATE_FORMAT_ISO);
  const toStr = format(periodTo, DATE_FORMAT_ISO);
  return history.some(
    (record) =>
      record.budgetId === budgetId &&
      record.periodFrom === fromStr &&
      record.periodTo === toStr,
  );
};
