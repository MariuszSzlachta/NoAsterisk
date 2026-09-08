import type { RuleRecord } from '#features/admin-rules/model/rule-record';
import { isRecord } from '#shared/lib/is-record';
import { recordGuards } from '#shared/lib/record-guards';

export const isRuleRecord = (value: unknown): value is RuleRecord =>
  isRecord(value) &&
  recordGuards.hasString(value, 'id') &&
  recordGuards.hasString(value, 'keyword') &&
  typeof value.matcherType === 'string' &&
  (value.matcherType === 'Contains' || value.matcherType === 'Exact') &&
  recordGuards.hasString(value, 'categoryId') &&
  recordGuards.hasFiniteNumber(value, 'priority') &&
  recordGuards.hasString(value, 'createdAt');
