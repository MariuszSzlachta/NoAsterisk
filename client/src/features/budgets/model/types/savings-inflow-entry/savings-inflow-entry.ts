export interface SavingsInflowEntry {
  readonly id: string;
  readonly amount: number;
  readonly sourceBudgetName: string | undefined;
  readonly date: string;
}
