import type { MatcherType } from '#features/admin-rules/model/matcher-type';

export interface RuleViewModel {
  readonly id: string;
  readonly keyword: string;
  readonly matcherType: MatcherType;
  readonly matcherLabel: string;
  readonly categoryId: string;
  readonly categoryLabel: string;
  readonly categoryColor: string;
  readonly priority: number;
  readonly createdAt: string;
}
