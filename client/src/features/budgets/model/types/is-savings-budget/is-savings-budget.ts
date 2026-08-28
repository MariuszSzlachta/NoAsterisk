import type { BudgetRecord } from '#features/budgets/model/types/budget-record';
import type { SavingsBudgetRecord } from '#features/budgets/model/types/savings-budget-record';

export const isSavingsBudget = (budget: BudgetRecord): budget is SavingsBudgetRecord =>
  budget.budgetType === 'savings';
