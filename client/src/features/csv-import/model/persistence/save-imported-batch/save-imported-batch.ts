import { createImportHistoryRecord } from '#features/csv-import/model/history/create-import-history-record';
import { isImportHistoryRecord } from '#features/csv-import/model/history/is-import-history-record';
import type { ImportHistoryRecord } from '#features/csv-import/model/history/types';
import { isImportedTransaction } from '#features/csv-import/model/persistence/is-imported-transaction';
import { INVALID_IMPORT_HISTORY_RECORD } from '#features/csv-import/model/persistence/save-import-history-record/constants/invalid-import-history-record';
import type {
  SaveImportedBatchInput,
  SaveImportedBatchResult,
} from '#features/csv-import/model/persistence/save-imported-batch/types';
import { INVALID_IMPORTED_TRANSACTIONS } from '#features/csv-import/model/persistence/save-imported-transactions/constants/invalid-imported-transactions';
import { isStoredTransaction } from '#features/transactions/model/is-stored-transaction';
import type { StoredTransaction } from '#features/transactions/model/types';
import {
  IMPORT_HISTORY_COLLECTION,
  TRANSACTIONS_COLLECTION,
} from '#shared/adapters/persistence/ports';
import { encryptedPersistence } from '#shared/adapters/persistence/session';

export const saveImportedBatch = async (
  records: ReadonlyArray<StoredTransaction>,
  input: SaveImportedBatchInput,
): Promise<SaveImportedBatchResult> => {
  if (!records.every(isImportedTransaction)) {
    throw new Error(INVALID_IMPORTED_TRANSACTIONS);
  }

  const result = await encryptedPersistence.putManyIfAbsentWithRelated(
    {
      collection: TRANSACTIONS_COLLECTION,
      records,
      validator: isStoredTransaction,
      getId: (record) => record.id,
      getDuplicateKey: (record) => record.contentHash,
    },
    (writeResult) => {
      const historyRecord = createImportHistoryRecord({
        ...input,
        acceptedCount: writeResult.written.length,
        duplicateCount: writeResult.duplicatesSkipped,
      });
      if (!isImportHistoryRecord(historyRecord)) {
        throw new Error(INVALID_IMPORT_HISTORY_RECORD);
      }
      return {
        collection: IMPORT_HISTORY_COLLECTION,
        records: [historyRecord],
        getId: (record: ImportHistoryRecord) => record.batchId,
      };
    },
  );

  const historyRecord = createImportHistoryRecord({
    ...input,
    acceptedCount: result.written.length,
    duplicateCount: result.duplicatesSkipped,
  });
  if (!isImportHistoryRecord(historyRecord)) {
    throw new Error(INVALID_IMPORT_HISTORY_RECORD);
  }

  return {
    ...result,
    historyRecord,
  };
};
