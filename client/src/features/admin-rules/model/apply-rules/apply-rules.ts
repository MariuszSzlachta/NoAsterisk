import type { AutoCategorizeResult } from '#features/admin-rules/model/types';

// ─── Types ───────────────────────────────────────────────────────

export interface ApplyResult {
  readonly categorized: number;
  readonly total: number;
}

// ─── Pure Functions ──────────────────────────────────────────────

export const countUncategorized = (
  transactions: ReadonlyArray<{ readonly categoryId?: string }>,
): number =>
  transactions.filter((tx) => tx.categoryId === undefined).length;

export const groupByCategoryId = (
  results: ReadonlyArray<AutoCategorizeResult>,
): ReadonlyMap<string, ReadonlyArray<string>> => {
  const grouped = new Map<string, string[]>();

  for (const result of results) {
    const existing = grouped.get(result.categoryId);
    const ids = existing !== undefined ? [...existing, result.transactionId] : [result.transactionId];
    grouped.set(result.categoryId, ids);
  }

  return grouped;
};

export const buildApplyResult = (
  categorizedCount: number,
  uncategorizedCount: number,
): ApplyResult => ({
  categorized: categorizedCount,
  total: uncategorizedCount,
});
