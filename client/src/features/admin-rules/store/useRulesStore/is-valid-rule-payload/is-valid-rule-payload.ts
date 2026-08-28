import { MIN_PRIORITY } from '#features/admin-rules/model/min-priority';
import type { RuleRecord } from '#features/admin-rules/model/rule-record';
import { isMatcherType } from '#features/admin-rules/model/is-matcher-type';

export const isValidRulePayload = (
  rule: Omit<RuleRecord, 'id' | 'createdAt'>,
): boolean =>
  rule.keyword.trim().length > 0 &&
  rule.categoryId.trim().length > 0 &&
  isMatcherType(rule.matcherType) &&
  Number.isFinite(rule.priority) &&
  rule.priority >= MIN_PRIORITY;
