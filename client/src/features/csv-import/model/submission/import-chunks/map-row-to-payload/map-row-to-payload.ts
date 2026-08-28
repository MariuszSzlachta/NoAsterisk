import type { TransactionRow } from '#features/csv-import/model/transformation/types/transaction-row';
import type { ImportRowPayload } from '#features/csv-import/model/submission/import-row-payload';

export const mapRowToPayload = (
  row: TransactionRow,
  contentHash: string,
): ImportRowPayload => ({
  amount: Math.abs(row.amount),
  currency: row.currency,
  type: row.amount >= 0 ? 'income' : 'expense',
  description: row.title,
  date: row.date,
  categoryIds: [],
  contentHash,
});
