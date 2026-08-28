import type { AutoCategorizeResult } from '#features/admin-rules/model/auto-categorize-result';

export const groupByCategoryId = (
  results: ReadonlyArray<AutoCategorizeResult>,
): ReadonlyMap<string, ReadonlyArray<string>> =>
  results.reduce((grouped, result) => {
    const existing = grouped.get(result.categoryId);
    const ids = existing !== undefined ? [...existing, result.transactionId] : [result.transactionId];
    grouped.set(result.categoryId, ids);
    return grouped;
  }, new Map<string, string[]>());
