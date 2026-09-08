import type { BudgetRecord } from '#features/budgets/model/types/budget-record';
import { isBudgetPeriod } from '#features/budgets/model/is-budget-period';
import { isRecord } from '#shared/lib/is-record';
import { recordGuards } from '#shared/lib/record-guards';

export const isBudgetRecord = (value: unknown): value is BudgetRecord => {
  if (
    !isRecord(value) ||
    !recordGuards.hasString(value, 'id') ||
    !recordGuards.hasString(value, 'workspaceId') ||
    !recordGuards.hasString(value, 'name') ||
    !recordGuards.hasString(value, 'color') ||
    !recordGuards.hasFiniteNumber(value, 'limitAmount') ||
    !recordGuards.hasString(value, 'limitCurrency') ||
    !Array.isArray(value.categoryIds) ||
    !value.categoryIds.every((id) => typeof id === 'string') ||
    !recordGuards.hasString(value, 'createdAt') ||
    typeof value.isArchived !== 'boolean'
  ) {
    return false;
  }
  if (value.budgetType === 'savings') {
    return value.period === null;
  }
  return value.budgetType === 'standard' && isBudgetPeriod(value.period);
};
