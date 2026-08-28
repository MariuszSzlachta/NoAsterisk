import type { AutoCategorizeResult } from '#features/admin-rules/model/auto-categorize-result';
import type { RuleRecord } from '#features/admin-rules/model/rule-record';
import type { UncategorizedTransaction } from '#features/admin-rules/model/uncategorized-transaction';
import { filterUncategorized } from '#features/admin-rules/model/auto-categorize/filter-uncategorized';
import { findMatchingRule } from '#features/admin-rules/model/auto-categorize/find-matching-rule';
import { isValidRule } from '#features/admin-rules/model/auto-categorize/is-valid-rule';
import { sortRulesByPriority } from '#features/admin-rules/model/auto-categorize/sort-rules-by-priority';

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

  return uncategorized.reduce<AutoCategorizeResult[]>((results, tx) => {
    const matchingRule = findMatchingRule(tx.description, sortedRules);

    if (matchingRule) {
      results.push({
        transactionId: tx.id,
        categoryId: matchingRule.categoryId,
      });
    }

    return results;
  }, []);
};
