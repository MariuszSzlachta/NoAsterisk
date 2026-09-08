import type { StoredTransaction } from '#entities/transaction/types';

export interface ImportedTransactionsWriteResult {
  readonly written: ReadonlyArray<StoredTransaction>;
  readonly duplicatesSkipped: number;
}
