import type { TransactionRow } from './types';

/**
 * Hash for dedup: date + amount + title.
 * Used for cross-file duplicate detection (already imported transactions).
 * Note: rows with NaN amount get unique hashes (won't false-match).
 */
const hashTransaction = (row: TransactionRow): string => {
  // NaN amount → unique hash per call (intentional: error rows never match, even themselves)
  const amount = isNaN(row.amount) ? crypto.randomUUID() : String(row.amount);
  return `${row.date}|${amount}|${row.title.toLowerCase().trim()}`;
};

/**
 * Detect duplicate and near-duplicate rows within a batch.
 *
 * Strategy:
 * - First occurrence of a hash: passes as-is
 * - Second occurrence: marked as 'warning' (near-duplicate) — likely a legitimate
 *   repeat purchase (e.g. two trips to Biedronka for 87.43 PLN same day)
 * - Third+ occurrence: marked as 'duplicate' — very unlikely to be legitimate
 *
 * Rationale (CR-6): same amount + same store + same day happens in real life
 * (morning coffee + afternoon coffee at same chain). Hard-flagging as 'duplicate'
 * causes data loss. Warning lets the user decide.
 *
 * Cross-file dedup (detectDuplicatesAgainstExisting) remains strict — if the hash
 * already exists in backend, it's a true duplicate (same import run twice).
 */
export const detectDuplicatesInBatch = (
  rows: readonly TransactionRow[],
): TransactionRow[] => {
  const seen = new Map<string, number>();

  return rows.map((row) => {
    if (row.status === 'error') {
      return row;
    }

    const hash = hashTransaction(row);
    const count = seen.get(hash) ?? 0;
    seen.set(hash, count + 1);

    if (count === 0) {
      // First occurrence — pass through
      return { ...row, duplicateHash: hash };
    }

    if (count === 1) {
      // Second occurrence — near-duplicate (warning, user decides)
      return {
        ...row,
        status: 'warning' as const,
        statusReason: 'Near-duplicate: same date, amount, and title',
        duplicateHash: hash,
      };
    }

    // Third+ occurrence — likely true duplicate
    return {
      ...row,
      status: 'duplicate' as const,
      statusReason: 'Duplicate in file (3+ identical rows)',
      duplicateHash: hash,
    };
  });
};

/**
 * Cross-check against existing transactions from backend.
 * This is strict: if the hash exists in backend, it's already imported.
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
