import type { SavingsBudgetRecord } from '#features/budgets/model/types/savings-budget-record';
import type { StandardBudgetRecord } from '#features/budgets/model/types/standard-budget-record';

export type BudgetRecord = StandardBudgetRecord | SavingsBudgetRecord;
