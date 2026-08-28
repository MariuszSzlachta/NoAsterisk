import type { RowStatus } from '#features/csv-import/model/transformation/types/row-status';

export interface TransactionRow {
  readonly id: string;
  readonly date: string;
  readonly title: string;
  readonly amount: number;
  readonly currency: string;
  readonly balance?: number;
  readonly category?: string;
  readonly source?: string;
  readonly recipient?: string;
  readonly counterpart?: string;
  readonly reference?: string;
  readonly status: RowStatus;
  readonly statusReason?: string;
  readonly duplicateHash?: string;
}
