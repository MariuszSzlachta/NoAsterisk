import type { MatcherType } from '#features/admin-rules/model/matcher-type';

export interface RuleRecord {
  readonly id: string;
  readonly keyword: string;
  readonly matcherType: MatcherType;
  readonly categoryId: string;
  readonly priority: number;
  readonly createdAt: string;
}
