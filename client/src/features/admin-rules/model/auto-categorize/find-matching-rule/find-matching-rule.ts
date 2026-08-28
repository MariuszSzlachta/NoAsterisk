import type { RuleRecord } from '#features/admin-rules/model/rule-record';
import { matchesRule } from '#features/admin-rules/model/auto-categorize/matches-rule';

export const findMatchingRule = (
  description: string,
  sortedRules: ReadonlyArray<RuleRecord>,
): RuleRecord | undefined =>
  sortedRules.find((rule) => matchesRule(description, rule));
