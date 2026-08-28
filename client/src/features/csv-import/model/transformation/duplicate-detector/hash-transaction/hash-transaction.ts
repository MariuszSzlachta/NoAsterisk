import type { TransactionRow } from '#features/csv-import/model/transformation/types/transaction-row';

import { HASH_SEPARATOR } from '#features/csv-import/model/transformation/duplicate-detector/hash-transaction/constants/hash-separator';

/** NaN amount → unique hash per call (error rows never match, even themselves) */
export const hashTransaction = (row: TransactionRow): string => {
  const amount = isNaN(row.amount) ? crypto.randomUUID() : String(row.amount);
  return [row.date, amount, row.title.toLowerCase().trim()].join(HASH_SEPARATOR);
};
