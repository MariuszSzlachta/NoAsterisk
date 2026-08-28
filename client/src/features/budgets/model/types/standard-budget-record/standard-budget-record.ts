import type { BudgetPeriodRecord } from '#features/budgets/model/types/budget-period-record';
import type { BudgetRecordBase } from '#features/budgets/model/types/budget-record-base';

export interface StandardBudgetRecord extends BudgetRecordBase {
  readonly budgetType: 'standard';
  readonly period: BudgetPeriodRecord;
}
