import type { TransactionRow } from '#features/csv-import/model/types';
import type { TransactionTypeFilter } from '#features/csv-import/ui/hooks/usePreviewFilters/transaction-type-filter';

export const matchesTypeFilter = (
  row: TransactionRow,
  type: TransactionTypeFilter,
): boolean => {
  if (type === 'all') {
    return true;
  }
  if (type === 'income') {
    return row.amount > 0;
  }
  return row.amount < 0;
};
