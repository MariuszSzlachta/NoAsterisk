import { MIN_PRIORITY } from '#features/admin-rules/model/min-priority';
import type { RuleRecord } from '#features/admin-rules/model/rule-record';
import { isMatcherType } from '#features/admin-rules/model/is-matcher-type';

export const isValidRuleUpdate = (
  updates: Partial<Pick<RuleRecord, 'keyword' | 'matcherType' | 'categoryId' | 'priority'>>,
): boolean => {
  if (updates.keyword !== undefined && updates.keyword.trim().length === 0) return false;
  if (updates.matcherType !== undefined && !isMatcherType(updates.matcherType)) return false;
  if (updates.categoryId !== undefined && updates.categoryId.trim().length === 0) return false;
  if (updates.priority !== undefined && (!Number.isFinite(updates.priority) || updates.priority < MIN_PRIORITY)) return false;
  return true;
};
