import type { RuleRecord } from '#features/admin-rules/model/rule-record';

export const sortRulesByPriority = (
  rules: ReadonlyArray<RuleRecord>,
): ReadonlyArray<RuleRecord> =>
  [...rules].sort((a, b) => b.priority - a.priority);
