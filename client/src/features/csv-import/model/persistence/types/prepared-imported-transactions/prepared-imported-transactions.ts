import type { StoredTransaction } from '#features/transactions/model/types';
import type { ImportRejection } from '#features/csv-import/model/persistence/types/import-rejection';

export interface PreparedImportedTransactions {
  readonly records: ReadonlyArray<StoredTransaction>;
  readonly rejectedRows: ReadonlyArray<ImportRejection>;
}
