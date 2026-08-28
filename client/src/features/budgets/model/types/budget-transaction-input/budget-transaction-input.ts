/** Minimal transaction data needed for budget computation — wiring happens at page/hook level to avoid cross-feature imports */
export interface BudgetTransactionInput {
  readonly id: string;
  readonly date: string;
  readonly description: string;
  readonly amount: number;
  readonly currency: string;
  readonly budgetId?: string;
}
