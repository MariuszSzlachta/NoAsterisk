export interface CategorizationRuleResponseDto {
  id: string;
  keyword: string;
  categoryId: string;
  matcherType: 'Contains' | 'Exact';
  priority: number;
  createdAt: string;
}
