export interface BudgetKpiVM {
  readonly totalPlanned: number;
  readonly totalSpent: number;
  readonly totalRemaining: number;
  readonly needsAttentionCount: number;
  readonly currency: string;
}
