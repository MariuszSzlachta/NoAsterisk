import { useState } from 'react';

import { autoCategorize } from '#features/admin-rules/model';
import type { AutoCategorizeResult } from '#features/admin-rules/model/types';
import { useRulesStore } from '#features/admin-rules/store/useRulesStore';
// ARCH-EXCEPTION: cross-feature import — rules must read and modify transactions.
// Accepted per devplan. Alternative (entities/) is overkill at this stage.
import { useTransactionsStore } from '#features/transactions';

// ─── Types ───────────────────────────────────────────────────────

export interface ApplyResult {
  readonly categorized: number;
  readonly total: number;
}

interface UseApplyRulesResult {
  readonly handleApplyRules: () => void;
  readonly lastResult: ApplyResult | undefined;
}

// ─── Pure Functions (exported for testability) ───────────────────

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

// ─── Hook ────────────────────────────────────────────────────────

export const useApplyRules = (): UseApplyRulesResult => {
  const rules = useRulesStore((s) => s.rules);
  const transactions = useTransactionsStore((s) => s.transactions);
  const bulkUpdateCategory = useTransactionsStore((s) => s.bulkUpdateCategory);

  const [lastResult, setLastResult] = useState<ApplyResult | undefined>(undefined);

  const handleApplyRules = (): void => {
    const uncategorizedCount = countUncategorized(transactions);
    const results = autoCategorize(rules, transactions);
    const grouped = groupByCategoryId(results);

    for (const [categoryId, ids] of grouped) {
      bulkUpdateCategory([...ids], categoryId);
    }

    setLastResult(buildApplyResult(results.length, uncategorizedCount));
  };

  return {
    handleApplyRules,
    lastResult,
  };
};
