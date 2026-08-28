export interface BudgetTransactionVM {
  readonly id: string;
  readonly description: string;
  readonly amount: number;
  readonly currency: string;
  readonly date: string;
}
