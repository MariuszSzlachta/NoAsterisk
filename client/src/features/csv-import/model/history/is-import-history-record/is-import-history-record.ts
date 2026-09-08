import type { ImportHistoryRecord } from '#features/csv-import/model/history/types';
import { isRecord } from '#shared/lib/is-record';

export const isImportHistoryRecord = (
  value: unknown,
): value is ImportHistoryRecord => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.batchId === 'string' &&
    value.batchId.trim().length > 0 &&
    typeof value.fileName === 'string' &&
    value.fileName.trim().length > 0 &&
    typeof value.completedAt === 'string' &&
    value.completedAt.trim().length > 0 &&
    Number.isFinite(Date.parse(value.completedAt)) &&
    typeof value.acceptedCount === 'number' &&
    Number.isInteger(value.acceptedCount) &&
    value.acceptedCount >= 0 &&
    typeof value.duplicateCount === 'number' &&
    Number.isInteger(value.duplicateCount) &&
    value.duplicateCount >= 0 &&
    typeof value.rejectedCount === 'number' &&
    Number.isInteger(value.rejectedCount) &&
    value.rejectedCount >= 0
  );
};
