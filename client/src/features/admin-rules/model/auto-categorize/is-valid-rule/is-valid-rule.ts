import { MIN_PRIORITY } from '#features/admin-rules/model/min-priority';
import type { RuleRecord } from '#features/admin-rules/model/rule-record';

export const isValidRule = (rule: RuleRecord): boolean =>
  rule.keyword.trim().length > 0 && rule.priority >= MIN_PRIORITY;
