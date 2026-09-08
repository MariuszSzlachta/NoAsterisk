import type { BudgetRecordBase } from '#features/budgets/model/types/budget-record-base';
import type { BudgetRecord } from '#features/budgets/model/types/budget-record';
import type { UpdateBudgetProps } from '#features/budgets/model/types/update-budget-props';

export const updateBudgetRecord = (existing: BudgetRecord, props: UpdateBudgetProps): BudgetRecord => {
  const limitAmount = props.limitAmount ?? existing.limitAmount;
  if (!Number.isFinite(limitAmount) || limitAmount < 0) {
    throw new Error('limitAmount must be a non-negative finite number');
  }

  const base: BudgetRecordBase = {
    id: existing.id,
    workspaceId: existing.workspaceId,
    name: props.name === undefined ? existing.name : props.name.trim(),
    color: props.color === undefined ? existing.color : props.color.trim(),
    limitAmount,
    limitCurrency: props.limitCurrency === undefined
      ? existing.limitCurrency
      : props.limitCurrency.toUpperCase(),
    categoryIds: props.categoryIds === undefined ? existing.categoryIds : props.categoryIds,
    createdAt: existing.createdAt,
    isArchived: existing.isArchived,
  };

  if (existing.budgetType === 'standard') {
    const period = props.period === undefined ? existing.period : props.period;
    if (period === null) {
      throw new Error('Cannot remove period from standard budget');
    }
    return { ...base, budgetType: 'standard', period };
  }

  if (props.period !== undefined && props.period !== null) {
    throw new Error('Cannot add period to savings budget');
  }
  return { ...base, budgetType: 'savings', period: null };
};
