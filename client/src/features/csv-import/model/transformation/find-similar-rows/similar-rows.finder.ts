import type { TransactionRow } from '#features/csv-import/model/transformation/types/transaction-row';

/** Excludes error rows — can't propagate corrections to broken data */
export const findSimilarRows = (
  rows: ReadonlyArray<TransactionRow>,
  editedRowId: string,
  originalTitle: string,
): ReadonlyArray<TransactionRow> => {
  if (!originalTitle.trim()) {
    return [];
  }

  const normalizedOriginal = originalTitle.toLowerCase().trim();

  return rows.filter(
    (row) =>
      row.id !== editedRowId &&
      row.status !== 'error' &&
      row.title.toLowerCase().trim() === normalizedOriginal,
  );
};
