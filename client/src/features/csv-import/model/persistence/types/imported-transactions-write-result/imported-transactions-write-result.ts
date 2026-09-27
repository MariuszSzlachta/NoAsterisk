import type { StoredTransaction } from '#model/transaction/types';

export interface ImportedTransactionsWriteResult {
  readonly written: ReadonlyArray<StoredTransaction>;
  readonly duplicatesSkipped: number;
}
