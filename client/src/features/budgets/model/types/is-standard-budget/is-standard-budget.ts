import type { BudgetRecord } from '#features/budgets/model/types/budget-record';
import type { StandardBudgetRecord } from '#features/budgets/model/types/standard-budget-record';

export const isStandardBudget = (budget: BudgetRecord): budget is StandardBudgetRecord =>
  budget.budgetType === 'standard';
