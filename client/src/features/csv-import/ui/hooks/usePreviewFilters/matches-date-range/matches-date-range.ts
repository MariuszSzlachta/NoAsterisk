import type { TransactionRow } from '#features/csv-import/model/types';

export const matchesDateRange = (
  row: TransactionRow,
  dateFrom: string,
  dateTo: string,
): boolean => {
  if (!dateFrom && !dateTo) {
    return true;
  }
  const rowDate = row.date;
  if (dateFrom && rowDate < dateFrom) {
    return false;
  }
  if (dateTo && rowDate > dateTo) {
    return false;
  }
  return true;
};
