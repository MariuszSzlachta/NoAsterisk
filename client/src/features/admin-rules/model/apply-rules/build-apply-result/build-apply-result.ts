import type { ApplyResult } from '#features/admin-rules/model/apply-rules/apply-result';

export const buildApplyResult = (
  categorizedCount: number,
  uncategorizedCount: number,
): ApplyResult => ({
  categorized: categorizedCount,
  total: uncategorizedCount,
});
