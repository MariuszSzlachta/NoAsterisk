import { useState } from 'react';

import { autoCategorize } from '#features/admin-rules/model';
import type { ApplyResult } from '#features/admin-rules/model/apply-rules';
import { buildApplyResult, countUncategorized, groupByCategoryId } from '#features/admin-rules/model/apply-rules';
import { useRulesStore } from '#features/admin-rules/store/useRulesStore';
import { useTransactionsStore } from '#model/transaction';

interface UseApplyRulesResult {
  readonly handleApplyRules: () => void;
  readonly lastResult: ApplyResult | undefined;
}

export const useApplyRules = (): UseApplyRulesResult => {
  const rules = useRulesStore((s) => s.rules);
  const transactions = useTransactionsStore((s) => s.transactions);
  const bulkUpdateCategory = useTransactionsStore((s) => s.bulkUpdateCategory);

  const [lastResult, setLastResult] = useState<ApplyResult | undefined>(undefined);

  const handleApplyRules = (): void => {
    const uncategorizedCount = countUncategorized(transactions);
    const results = autoCategorize(rules, transactions);
    const grouped = groupByCategoryId(results);

    grouped.forEach((ids, categoryId) => {
      bulkUpdateCategory([...ids], categoryId);
    });

    setLastResult(buildApplyResult(results.length, uncategorizedCount));
  };

  return {
    handleApplyRules,
    lastResult,
  };
};
