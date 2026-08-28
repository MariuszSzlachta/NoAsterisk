import type { TransactionType } from '#features/csv-import/model/submission/transaction-type';

export interface ImportRowPayload {
  readonly amount: number;
  readonly currency: string;
  readonly type: TransactionType;
  readonly description: string;
  readonly date: string;
  readonly categoryIds: readonly string[];
  readonly contentHash: string;
}
