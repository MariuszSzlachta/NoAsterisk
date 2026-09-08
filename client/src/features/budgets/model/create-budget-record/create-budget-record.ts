import type { BudgetRecordBase } from '#features/budgets/model/types/budget-record-base';
import type { BudgetRecord } from '#features/budgets/model/types/budget-record';
import type { CreateBudgetProps } from '#features/budgets/model/types/create-budget-props';

export const createBudgetRecord = (props: CreateBudgetProps): BudgetRecord => {
  if (!Number.isFinite(props.limitAmount) || props.limitAmount < 0) {
    throw new Error('limitAmount must be a non-negative finite number');
  }

  const base: BudgetRecordBase = {
    id: crypto.randomUUID(),
    workspaceId: props.workspaceId,
    name: props.name.trim(),
    color: props.color.trim(),
    limitAmount: props.limitAmount,
    limitCurrency: props.limitCurrency.toUpperCase(),
    categoryIds: props.categoryIds ?? [],
    createdAt: new Date().toISOString(),
    isArchived: false,
  };

  if (props.budgetType === 'standard') {
    if (props.period === null) {
      throw new Error('Standard budget must have a period');
    }
    return { ...base, budgetType: 'standard', period: props.period };
  }
  if (props.period !== null) {
    throw new Error('Savings budget must not have a period');
  }
  return { ...base, budgetType: 'savings', period: null };
};
