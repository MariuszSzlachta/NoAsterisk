import type { TransactionRow } from '#features/csv-import/model/transformation/types/transaction-row';
import { IMPORTABLE_ROW_STATUSES } from '#features/csv-import/model/persistence/is-importable-row/constants/importable-row-statuses';

/** Only rows that passed validation can be accepted during the review step. */
export const isImportableRow = (row: TransactionRow): boolean =>
  IMPORTABLE_ROW_STATUSES.includes(row.status);
