import type { RolloverRecord } from '#features/budgets/model/types/rollover-record';

export interface PeriodHistoryRecord {
  readonly id: string;
  readonly budgetId: string;
  readonly periodFrom: string;
  readonly periodTo: string;
  readonly limitAmount: number;
  readonly spentAmount: number;
  readonly remainingAmount: number;
  readonly closedAt: string;
  readonly rollover: RolloverRecord | null;
}
