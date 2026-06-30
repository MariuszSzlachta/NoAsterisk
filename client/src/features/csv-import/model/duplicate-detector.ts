import type { TransactionRow } from './types';

/**
 * Hash for dedup: date + amount + title.
 * Used for cross-file duplicate detection (already imported transactions).
 * Note: rows with NaN amount get unique hashes (won't false-match).
 */
const hashTransaction = (row: TransactionRow): string => {
  const amount = isNaN(row.amount) ? crypto.randomUUID() : String(row.amount);
  return `${row.date}|${amount}|${row.title.toLowerCase().trim()}`;
};

/**
 * Detect duplicate rows within a batch.
 * First occurrence passes, subsequent identical rows flagged as duplicate.
 * Note: legitimate same-day same-amount purchases (e.g. two Biedronka trips)
 * will be flagged — user can un-flag in step 4 UI.
 */
export const detectDuplicatesInBatch = (
  rows: readonly TransactionRow[],
): TransactionRow[] => {
  const seen = new Map<string, number>();

  return rows.map((row) => {
    if (row.status === 'error') {
      return row;
    } // don't dedup error rows

    const hash = hashTransaction(row);
    const count = seen.get(hash) ?? 0;
    seen.set(hash, count + 1);

    if (count > 0) {
      return {
        ...row,
        status: 'duplicate' as const,
        statusReason: 'Duplicate in file',
        duplicateHash: hash,
      };
    }
    return { ...row, duplicateHash: hash };
  });
};

/**
 * Cross-check against existing transactions from backend.
 */
export const detectDuplicatesAgainstExisting = (
  rows: readonly TransactionRow[],
  existingHashes: ReadonlySet<string>,
): TransactionRow[] =>
  rows.map((row) => {
    if (row.status === 'error' || row.status === 'duplicate') {
      return row;
    }

    const hash = row.duplicateHash ?? hashTransaction(row);
    if (existingHashes.has(hash)) {
      return {
        ...row,
        status: 'duplicate' as const,
        statusReason: 'Already imported',
        duplicateHash: hash,
      };
    }
    return row;
  });

export { hashTransaction };
