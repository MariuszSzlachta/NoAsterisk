import type { TransactionRow } from '#features/csv-import/model/transformation/types/transaction-row';

export const isImportableRow = (row: TransactionRow): boolean =>
  row.status === 'ok' || row.status === 'warning';
