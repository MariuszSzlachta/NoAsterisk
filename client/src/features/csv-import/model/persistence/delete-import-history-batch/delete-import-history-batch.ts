import { isImportHistoryRecord } from '#features/csv-import/model/history/is-import-history-record';
import { isStoredTransaction } from '#model/transaction/is-stored-transaction';
import {
  IMPORT_HISTORY_COLLECTION,
  TRANSACTIONS_COLLECTION,
} from '#shared/adapters/persistence/ports';
import { encryptedPersistence } from '#shared/adapters/persistence/session';

export const deleteImportHistoryBatch = async (
  batchId: string,
): Promise<void> => {
  await encryptedPersistence.deleteMatchingRecords([
    {
      collection: TRANSACTIONS_COLLECTION,
      validator: isStoredTransaction,
      shouldDelete: (record) =>
        isStoredTransaction(record) && record.batchId === batchId,
    },
    {
      collection: IMPORT_HISTORY_COLLECTION,
      validator: isImportHistoryRecord,
      shouldDelete: (record) =>
        isImportHistoryRecord(record) && record.batchId === batchId,
    },
  ]);
};
