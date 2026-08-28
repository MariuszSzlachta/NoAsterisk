import type { PeriodHistoryRecord } from '#features/budgets/model/types/period-history-record';

export const isDuplicateClosure = (
  record: PeriodHistoryRecord,
  existingHistory: readonly PeriodHistoryRecord[],
): boolean =>
  existingHistory.some(
    (existing) =>
      existing.budgetId === record.budgetId &&
      existing.periodFrom === record.periodFrom &&
      existing.periodTo === record.periodTo,
  );
