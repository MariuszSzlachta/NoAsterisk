import type { RolloverTargetType } from '#features/budgets/model/types/rollover-target-type';

export interface RolloverRecord {
  readonly amount: number;
  readonly targetType: RolloverTargetType;
  readonly targetBudgetId: string;
}
