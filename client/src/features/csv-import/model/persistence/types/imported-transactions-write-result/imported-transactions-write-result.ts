import type { StoredTransaction } from '#features/transactions/model/types';

export interface ImportedTransactionsWriteResult {
  readonly written: ReadonlyArray<StoredTransaction>;
  readonly duplicatesSkipped: number;
}
