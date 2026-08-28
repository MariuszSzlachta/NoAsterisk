import type { TransactionRow } from '#features/csv-import/model/transformation/types';

/**
 * Hash for dedup: date + amount + title.
 * Used for cross-file duplicate detection (already imported transactions).
 * Note: rows with NaN amount get unique hashes (won't false-match).
 */
export const hashTransaction = (row: TransactionRow): string => {
  // NaN amount → unique hash per call (intentional: error rows never match, even themselves)
  const amount = isNaN(row.amount) ? crypto.randomUUID() : String(row.amount);
  return `${row.date}|${amount}|${row.title.toLowerCase().trim()}`;
};
