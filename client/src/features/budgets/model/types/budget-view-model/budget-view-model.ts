import type { BudgetStatus } from '#features/budgets/model/types/budget-status';
import type { BudgetTransactionVM } from '#features/budgets/model/types/budget-transaction-vm';

export interface BudgetViewModel {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly status: BudgetStatus;
  readonly statusLabel: string;
  readonly periodLabel: string;
  readonly daysRemaining: number;
  readonly spent: number;
  readonly limit: number;
  readonly remaining: number;
  readonly currency: string;
  readonly progressPercent: number;
  readonly spentPercent: number;
  readonly timePercent: number;
  readonly transactions: readonly BudgetTransactionVM[];
}
