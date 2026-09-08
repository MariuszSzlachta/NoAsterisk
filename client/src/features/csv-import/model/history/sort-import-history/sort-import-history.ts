import type { ImportHistoryRecord } from '#features/csv-import/model/history/types';

export const sortImportHistory = (
  records: ReadonlyArray<ImportHistoryRecord>,
): ReadonlyArray<ImportHistoryRecord> =>
  [...records].sort(
    (left, right) =>
      Date.parse(right.completedAt) - Date.parse(left.completedAt),
  );
