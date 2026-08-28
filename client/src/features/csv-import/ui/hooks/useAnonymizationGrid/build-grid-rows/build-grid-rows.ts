import type { AnonymizationEntry, TransactionRow } from '#features/csv-import/model/types';
import type { AnonymizationGridRow } from '#features/csv-import/ui/hooks/useAnonymizationGrid/types';

export const buildGridRows = (
  rows: readonly Pick<
    TransactionRow,
    'id' | 'date' | 'title' | 'amount' | 'currency' | 'balance' | 'category'
  >[],
  entries: readonly AnonymizationEntry[],
): AnonymizationGridRow[] =>
  rows.map((row, idx) => {
    const entry = entries[idx];
    return {
      id: row.id,
      date: row.date,
      title: entry ? entry.anonymizedTitle : row.title,
      amount: row.amount,
      currency: row.currency,
      balance: row.balance,
      category: row.category,
      anonymizationStatus: entry ? entry.status : 'safe',
      rowIndex: idx,
    };
  });
