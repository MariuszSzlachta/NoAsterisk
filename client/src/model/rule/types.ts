export type MatcherType = 'Contains' | 'Exact';

export interface RuleRecord {
  readonly id: string;
  readonly keyword: string;
  readonly matcherType: MatcherType;
  readonly categoryId: string;
  readonly priority: number;
  readonly createdAt: string;
}

export interface UncategorizedTransaction {
  readonly id: string;
  readonly description: string;
  readonly categoryId?: string;
}

export interface AutoCategorizeResult {
  readonly transactionId: string;
  readonly categoryId: string;
}
