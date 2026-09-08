import { isStoredTransaction } from '#entities/transaction/is-stored-transaction';
import type { StoredTransaction } from '#entities/transaction/types';
import { isImportedTransaction } from '#features/csv-import/model/persistence/is-imported-transaction';
import type { ImportedTransactionsWriteResult } from '#features/csv-import/model/persistence/types';
import { INVALID_IMPORTED_TRANSACTIONS } from '#features/csv-import/model/persistence/save-imported-transactions/constants/invalid-imported-transactions';
import { encryptedPersistence } from '#shared/adapters/persistence/session';
import { TRANSACTIONS_COLLECTION } from '#shared/adapters/persistence/ports';

/** Validates the complete write set before handing it to encrypted persistence. */
export const saveImportedTransactions = async (
  records: ReadonlyArray<StoredTransaction>,
): Promise<ImportedTransactionsWriteResult> => {
  if (!records.every(isImportedTransaction)) {
    throw new Error(INVALID_IMPORTED_TRANSACTIONS);
  }

  const repository = encryptedPersistence.repository(
    TRANSACTIONS_COLLECTION,
    isStoredTransaction,
    (record) => record.id,
  );
  return repository.putManyIfAbsent(records, (record) => record.contentHash);
};
