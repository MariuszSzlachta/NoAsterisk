import type { ImportHistoryRecord } from '#features/csv-import/model/history/types';
import type { ImportedTransactionsWriteResult } from '#features/csv-import/model/persistence/types';

export interface SaveImportedBatchInput {
  readonly batchId: string;
  readonly fileName: string;
  readonly completedAt: string;
  readonly rejectedCount: number;
}

export interface SaveImportedBatchResult extends ImportedTransactionsWriteResult {
  readonly historyRecord: ImportHistoryRecord;
}
