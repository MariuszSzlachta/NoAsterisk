import type { QueryState } from '#shared/api';

export interface RecurringExpenseDto {
  readonly id: string;
  readonly name: string;
  readonly amount: number;
  readonly cycle: 'monthly' | 'yearly';
}

// TODO: Detect recurring expenses from transaction patterns (requires 3+ months of data).
// Recurring detection is a separate feature — keeping mock data until implemented.
export const useRecurringExpensesQuery = (): QueryState<
  RecurringExpenseDto[]
> => ({
  status: 'loaded',
  data: [
    { id: '1', name: 'Spotify', amount: 23.99, cycle: 'monthly' },
    { id: '2', name: 'Netflix', amount: 49.0, cycle: 'monthly' },
    { id: '3', name: 'Siłownia', amount: 129.0, cycle: 'monthly' },
    { id: '4', name: 'iCloud 200GB', amount: 12.99, cycle: 'monthly' },
    { id: '5', name: 'Domena + hosting', amount: 240.0, cycle: 'yearly' },
  ],
});
