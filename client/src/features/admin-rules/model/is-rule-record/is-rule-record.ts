import type { RuleRecord } from '#features/admin-rules/model/rule-record';
import { isMatcherType } from '#features/admin-rules/model/is-matcher-type';
import { recordGuards } from '#shared/lib/record-guards';
import { isRecord } from '#shared/lib/is-record';

export const isRuleRecord = (value: unknown): value is RuleRecord =>
  isRecord(value) &&
  recordGuards.hasString(value, 'id') &&
  recordGuards.hasString(value, 'keyword') &&
  typeof value.matcherType === 'string' &&
  isMatcherType(value.matcherType) &&
  recordGuards.hasString(value, 'categoryId') &&
  recordGuards.hasFiniteNumber(value, 'priority') &&
  recordGuards.hasString(value, 'createdAt');
