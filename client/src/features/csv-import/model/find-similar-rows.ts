import type { TransactionRow } from './types';

/**
 * Find rows with the same original title as the edited row.
 * Used for batch edit propagation — when user renames one transaction,
 * offer to rename all similar ones.
 *
 * Matching logic:
 * - Case-insensitive, trimmed comparison on `title` field
 * - Excludes the edited row itself
 * - Excludes error rows (can't propagate to broken data)
 */
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
