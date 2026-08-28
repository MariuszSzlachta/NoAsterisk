import type { TransactionRow } from '#features/csv-import/model/transformation/types';

export const isImportableRow = (row: TransactionRow): boolean =>
  row.status === 'ok' || row.status === 'warning';
