import type { RuleRecord } from '#features/admin-rules/model/rule-record';

/** Runtime type guard: validates each item has required RuleRecord fields */
export const isRuleRecordArray = (
  items: ReadonlyArray<Record<string, unknown>>,
): items is ReadonlyArray<RuleRecord> =>
  items.every(
    (item) =>
      typeof item['id'] === 'string' &&
      typeof item['keyword'] === 'string' &&
      typeof item['matcherType'] === 'string' &&
      typeof item['categoryId'] === 'string' &&
      typeof item['priority'] === 'number' &&
      typeof item['createdAt'] === 'string',
  );
