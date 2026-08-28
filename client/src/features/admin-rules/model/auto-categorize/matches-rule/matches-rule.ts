import type { RuleRecord } from '#features/admin-rules/model/rule-record';
import { containsMatch } from '#features/admin-rules/model/auto-categorize/contains-match';
import { exactMatch } from '#features/admin-rules/model/auto-categorize/exact-match';
import { isValidRule } from '#features/admin-rules/model/auto-categorize/is-valid-rule';

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
