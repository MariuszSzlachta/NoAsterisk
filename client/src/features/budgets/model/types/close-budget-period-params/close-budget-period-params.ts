import type { BudgetPeriodRecord } from '#features/budgets/model/types/budget-period-record';
import type { RolloverOption } from '#features/budgets/model/types/rollover-option';

export interface CloseBudgetPeriodParams {
  readonly budgetId: string;
  readonly spentAmount: number;
  readonly remainingAmount: number;
  readonly rolloverOption: RolloverOption;
  readonly periodFrom: string;
  readonly periodTo: string;
  readonly nextPeriod: BudgetPeriodRecord;
}
