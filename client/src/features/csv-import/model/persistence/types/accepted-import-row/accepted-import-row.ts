import type { TransactionRow } from '#features/csv-import/model/transformation/types/transaction-row';

export interface AcceptedImportRow {
  readonly row: TransactionRow;
  readonly rowIndex: number;
  readonly description: string;
}
