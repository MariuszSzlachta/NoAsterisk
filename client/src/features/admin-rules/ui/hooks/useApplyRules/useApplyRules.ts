// ═══════════════════════════════════════════════════════════════════
// Admin Rules — useApplyRules Hook
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';

import { autoCategorize } from '#features/admin-rules/model';
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

// ─── Hook ────────────────────────────────────────────────────────

export const useApplyRules = (): UseApplyRulesResult => {
  const rules = useRulesStore((s) => s.rules);
  const transactions = useTransactionsStore((s) => s.transactions);
  const bulkUpdateCategory = useTransactionsStore((s) => s.bulkUpdateCategory);

  const [lastResult, setLastResult] = useState<ApplyResult | undefined>(undefined);

  const handleApplyRules = (): void => {
    const uncategorizedCount = transactions.filter(
      (tx) => tx.categoryId === undefined,
    ).length;

    const results = autoCategorize(rules, transactions);

    // Group results by categoryId for bulk updates (fewer re-renders)
    const grouped = new Map<string, string[]>();
    for (const result of results) {
      const ids = grouped.get(result.categoryId) ?? [];
      ids.push(result.transactionId);
      grouped.set(result.categoryId, ids);
    }

    for (const [categoryId, ids] of grouped) {
      bulkUpdateCategory(ids, categoryId);
    }

    setLastResult({
      categorized: results.length,
      total: uncategorizedCount,
    });
  };

  return {
    handleApplyRules,
    lastResult,
  };
};
