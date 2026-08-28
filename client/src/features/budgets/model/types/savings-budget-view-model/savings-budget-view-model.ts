import type { SavingsInflowEntry } from '#features/budgets/model/types/savings-inflow-entry';

export interface SavingsBudgetViewModel {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly accumulated: number;
  readonly goalAmount: number;
  readonly currency: string;
  readonly progressPercent: number;
  readonly lastInflow: SavingsInflowEntry | null;
}
