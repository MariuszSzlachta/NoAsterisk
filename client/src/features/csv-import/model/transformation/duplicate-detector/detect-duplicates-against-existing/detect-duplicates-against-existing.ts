import type { TransactionRow } from '#features/csv-import/model/transformation/types';

import { hashTransaction } from '../hash-transaction';

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
