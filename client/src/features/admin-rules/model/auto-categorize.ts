// ═══════════════════════════════════════════════════════════════════
// Admin Rules Feature — Auto-Categorize
// ═══════════════════════════════════════════════════════════════════

import type { AutoCategorizeResult, RuleRecord, UncategorizedTransaction } from './types';

// ─── Matcher Logic ───────────────────────────────────────────────

const matchesRule = (description: string, rule: RuleRecord): boolean => {
  const descLower = description.toLowerCase();
  const keywordLower = rule.keyword.toLowerCase();

  switch (rule.matcherType) {
    case 'Contains':
      return descLower.includes(keywordLower);
    case 'Exact':
      return descLower === keywordLower;
    default:
      return false;
  }
};

// ─── Auto-Categorize Function ────────────────────────────────────

export const autoCategorize = (
  rules: ReadonlyArray<RuleRecord>,
  transactions: ReadonlyArray<UncategorizedTransaction>,
): ReadonlyArray<AutoCategorizeResult> => {
  if (rules.length === 0) {
    return [];
  }

  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);
  const uncategorized = transactions.filter((tx) => tx.categoryId === undefined);

  const results: AutoCategorizeResult[] = [];

  for (const tx of uncategorized) {
    const matchingRule = sortedRules.find((rule) => matchesRule(tx.description, rule));

    if (matchingRule) {
      results.push({
        transactionId: tx.id,
        categoryId: matchingRule.categoryId,
      });
    }
  }

  return results;
};
