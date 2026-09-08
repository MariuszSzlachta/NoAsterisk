import type {
  CreateImportHistoryRecordInput,
  ImportHistoryRecord,
} from '#features/csv-import/model/history/types';

export const createImportHistoryRecord = (
  input: CreateImportHistoryRecordInput,
): ImportHistoryRecord => ({
  batchId: input.batchId,
  fileName: input.fileName,
  completedAt: input.completedAt,
  acceptedCount: input.acceptedCount,
  duplicateCount: input.duplicateCount,
  rejectedCount: input.rejectedCount,
});
