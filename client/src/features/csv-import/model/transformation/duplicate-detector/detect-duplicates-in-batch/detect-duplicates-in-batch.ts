import { hashTransaction } from '#features/csv-import/model/transformation/duplicate-detector/hash-transaction';
import type { TransactionRow } from '#features/csv-import/model/transformation/types/transaction-row';

import { FIRST_OCCURRENCE_COUNT } from '#features/csv-import/model/transformation/duplicate-detector/detect-duplicates-in-batch/constants/first-occurrence-count';
import { NEAR_DUPLICATE_THRESHOLD } from '#features/csv-import/model/transformation/duplicate-detector/detect-duplicates-in-batch/constants/near-duplicate-threshold';
import { STATUS_REASON_NEAR_DUPLICATE } from '#features/csv-import/model/transformation/duplicate-detector/detect-duplicates-in-batch/constants/status-reason-near-duplicate';
import { STATUS_REASON_TRUE_DUPLICATE } from '#features/csv-import/model/transformation/duplicate-detector/detect-duplicates-in-batch/constants/status-reason-true-duplicate';

/**
 * Second occurrence = warning (same amount + same store + same day happens in real life).
 * Third+ occurrence = duplicate (very unlikely to be legitimate).
 * Cross-file dedup (detectDuplicatesAgainstExisting) remains strict.
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
    const count = seen.get(hash) ?? FIRST_OCCURRENCE_COUNT;
    seen.set(hash, count + 1);

    if (count === FIRST_OCCURRENCE_COUNT) {
      return { ...row, duplicateHash: hash };
    }

    if (count === NEAR_DUPLICATE_THRESHOLD) {
      return {
        ...row,
        status: 'warning',
        statusReason: STATUS_REASON_NEAR_DUPLICATE,
        duplicateHash: hash,
      };
    }

    return {
      ...row,
      status: 'duplicate',
      statusReason: STATUS_REASON_TRUE_DUPLICATE,
      duplicateHash: hash,
    };
  });
};
