import type { TransactionRow } from '#features/csv-import/model/types';

export const getRowId = (row: TransactionRow): string => row.id;
