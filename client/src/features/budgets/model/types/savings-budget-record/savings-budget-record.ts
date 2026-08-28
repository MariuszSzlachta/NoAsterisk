import type { BudgetRecordBase } from '#features/budgets/model/types/budget-record-base';

export interface SavingsBudgetRecord extends BudgetRecordBase {
  readonly budgetType: 'savings';
  readonly period: null;
}
