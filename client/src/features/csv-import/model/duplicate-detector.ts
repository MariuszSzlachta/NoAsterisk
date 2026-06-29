import type { TransactionRow } from './types';

const hashTransaction = (row: TransactionRow): string =>
  `${row.date}|${row.amount}|${row.title.toLowerCase().trim()}`;

/**
 * Detect duplicate rows within a batch.
 * Returns updated rows with status='duplicate' for duplicates.
 */
export const detectDuplicatesInBatch = (
  rows: readonly TransactionRow[],
): TransactionRow[] => {
  const seen = new Map<string, number>();

  return rows.map((row) => {
    const hash = hashTransaction(row);
    const existing = seen.get(hash);
    if (existing !== undefined) {
      return { ...row, status: 'duplicate' as const, statusReason: 'Duplikat w pliku', duplicateHash: hash };
    }
    seen.set(hash, row.amount);
    return { ...row, duplicateHash: hash };
  });
};

/**
 * Cross-check against existing transactions from backend.
 * Takes a set of hashes from backend and marks matches as duplicates.
 */
export const detectDuplicatesAgainstExisting = (
  rows: readonly TransactionRow[],
  existingHashes: ReadonlySet<string>,
): TransactionRow[] =>
  rows.map((row) => {
    const hash = row.duplicateHash ?? hashTransaction(row);
    if (existingHashes.has(hash)) {
      return { ...row, status: 'duplicate' as const, statusReason: 'Już zaimportowano', duplicateHash: hash };
    }
    return row;
  });

export { hashTransaction };
