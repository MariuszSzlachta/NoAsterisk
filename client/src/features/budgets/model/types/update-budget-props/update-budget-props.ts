import type { BudgetPeriodRecord } from '#features/budgets/model/types/budget-period-record';

export interface UpdateBudgetProps {
  readonly name?: string;
  readonly color?: string;
  readonly limitAmount?: number;
  readonly limitCurrency?: string;
  readonly period?: BudgetPeriodRecord | null;
  readonly categoryIds?: readonly string[];
}
