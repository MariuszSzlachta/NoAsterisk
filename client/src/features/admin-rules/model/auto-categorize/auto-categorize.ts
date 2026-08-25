import type { AutoCategorizeResult, RuleRecord, UncategorizedTransaction } from '#features/admin-rules/model/types';

// ─── Validation ──────────────────────────────────────────────────

const isValidRule = (rule: RuleRecord): boolean =>
  rule.keyword.trim().length > 0 && rule.priority >= 1;

// ─── Matcher Functions ───────────────────────────────────────────

const containsMatch = (description: string, keyword: string): boolean =>
  description.toLowerCase().includes(keyword.toLowerCase());

const exactMatch = (description: string, keyword: string): boolean =>
  description.toLowerCase() === keyword.toLowerCase();

export const matchesRule = (description: string, rule: RuleRecord): boolean => {
  if (!isValidRule(rule)) {
    return false;
  }

  switch (rule.matcherType) {
    case 'Contains':
      return containsMatch(description, rule.keyword);
    case 'Exact':
      return exactMatch(description, rule.keyword);
    default:
      return false;
  }
};

// ─── Pure Helpers ────────────────────────────────────────────────

export const sortRulesByPriority = (
  rules: ReadonlyArray<RuleRecord>,
): ReadonlyArray<RuleRecord> =>
  [...rules].sort((a, b) => b.priority - a.priority);

export const filterUncategorized = (
  transactions: ReadonlyArray<UncategorizedTransaction>,
): ReadonlyArray<UncategorizedTransaction> =>
  transactions.filter((tx) => tx.categoryId === undefined);

export const findMatchingRule = (
  description: string,
  sortedRules: ReadonlyArray<RuleRecord>,
): RuleRecord | undefined =>
  sortedRules.find((rule) => matchesRule(description, rule));

// ─── Auto-Categorize Orchestrator ────────────────────────────────

export const autoCategorize = (
  rules: ReadonlyArray<RuleRecord>,
  transactions: ReadonlyArray<UncategorizedTransaction>,
): ReadonlyArray<AutoCategorizeResult> => {
  const validRules = rules.filter(isValidRule);

  if (validRules.length === 0) {
    return [];
  }

  const sortedRules = sortRulesByPriority(validRules);
  const uncategorized = filterUncategorized(transactions);

  const results: AutoCategorizeResult[] = [];

  for (const tx of uncategorized) {
    const matchingRule = findMatchingRule(tx.description, sortedRules);

    if (matchingRule) {
      results.push({
        transactionId: tx.id,
        categoryId: matchingRule.categoryId,
      });
    }
  }

  return results;
};
