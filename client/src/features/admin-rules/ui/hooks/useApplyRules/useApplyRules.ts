import { useState } from 'react';

import { autoCategorize } from '#features/admin-rules/model';
import type { ApplyResult } from '#features/admin-rules/model/apply-rules';
import { buildApplyResult, countUncategorized, groupByCategoryId } from '#features/admin-rules/model/apply-rules';
import { useRulesStore } from '#features/admin-rules/store/useRulesStore';
// ARCH-EXCEPTION: cross-feature import — rules must read and modify transactions.
// Accepted per devplan. Alternative (entities/) is overkill at this stage.
import { useTransactionsStore } from '#features/transactions';

// ─── Types ───────────────────────────────────────────────────────

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
