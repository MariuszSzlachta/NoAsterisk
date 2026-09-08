import type { BudgetPeriodRecord } from '#features/budgets/model/types/budget-period-record';

export interface CreateBudgetProps {
  readonly workspaceId: string;
  readonly name: string;
  readonly budgetType: 'standard' | 'savings';
  readonly color: string;
  readonly limitAmount: number;
  readonly limitCurrency: string;
  readonly period: BudgetPeriodRecord | null;
  readonly categoryIds?: readonly string[];
}
