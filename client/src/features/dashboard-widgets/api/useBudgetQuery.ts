import type { BudgetDto } from '#features/dashboard-widgets/model/types';

export type { BudgetDto };

interface BudgetQueryResult {
  readonly data: BudgetDto[];
  readonly isLoading: boolean;
}

const MOCK_DATA: BudgetDto[] = [
  {
    label: 'Zakupy spożywcze',
    spent: 1850,
    limit: 2000,
    color: 'var(--cat-groceries)',
  },
  { label: 'Transport', spent: 620, limit: 800, color: 'var(--cat-transport)' },
  {
    label: 'Subskrypcje',
    spent: 340,
    limit: 350,
    color: 'var(--cat-subscriptions)',
  },
  {
    label: 'Jedzenie na mieście',
    spent: 890,
    limit: 1000,
    color: 'var(--cat-dining)',
  },
];

export const useBudgetQuery = (): BudgetQueryResult => ({
  data: MOCK_DATA,
  isLoading: false,
});
