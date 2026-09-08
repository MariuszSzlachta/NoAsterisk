import { isImportHistoryRecord } from '#features/csv-import/model/history/is-import-history-record';
import type { ImportHistoryRecord } from '#features/csv-import/model/history/types';
import { INVALID_IMPORT_HISTORY_RECORD } from '#features/csv-import/model/persistence/save-import-history-record/constants/invalid-import-history-record';
import { IMPORT_HISTORY_COLLECTION } from '#shared/adapters/persistence/ports';
import { encryptedPersistence } from '#shared/adapters/persistence/session';

export const saveImportHistoryRecord = async (
  record: ImportHistoryRecord,
): Promise<void> => {
  if (!isImportHistoryRecord(record)) {
    throw new Error(INVALID_IMPORT_HISTORY_RECORD);
  }

  await encryptedPersistence
    .repository(
      IMPORT_HISTORY_COLLECTION,
      isImportHistoryRecord,
      (historyRecord) => historyRecord.batchId,
    )
    .put(record);
};
