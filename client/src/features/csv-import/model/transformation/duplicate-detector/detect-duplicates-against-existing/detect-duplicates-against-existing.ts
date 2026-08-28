import { hashTransaction } from '#features/csv-import/model/transformation/duplicate-detector/hash-transaction';
import type { TransactionRow } from '#features/csv-import/model/transformation/types/transaction-row';

import { STATUS_REASON_ALREADY_IMPORTED } from '#features/csv-import/model/transformation/duplicate-detector/detect-duplicates-against-existing/constants/status-reason-already-imported';

export const detectDuplicatesAgainstExisting = (
  rows: readonly TransactionRow[],
  existingHashes: ReadonlySet<string>,
): TransactionRow[] =>
  rows.map((row) => {
    if (row.status === 'error' || row.status === 'duplicate') {
      return row;
    }

    const hash = row.duplicateHash ?? hashTransaction(row);
    if (!existingHashes.has(hash)) {
      return row;
    }

    return {
      ...row,
      status: 'duplicate',
      statusReason: STATUS_REASON_ALREADY_IMPORTED,
      duplicateHash: hash,
    };
  });
