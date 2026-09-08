import type { StoredTransaction } from '#entities/transaction/types';
import type { ImportRejection } from '#features/csv-import/model/persistence/types/import-rejection';

export interface PreparedImportedTransactions {
  readonly records: ReadonlyArray<StoredTransaction>;
  readonly rejectedRows: ReadonlyArray<ImportRejection>;
}
