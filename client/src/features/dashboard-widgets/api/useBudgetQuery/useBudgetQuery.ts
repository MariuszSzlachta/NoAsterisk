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
  { label: 'Transport', spent: 980, limit: 800, color: 'var(--cat-transport)' },
  {
    label: 'Subskrypcje',
    spent: 340,
    limit: 350,
    color: 'var(--cat-subscriptions)',
  },
  {
    label: 'Jedzenie na mieście',
    spent: 1320,
    limit: 1000,
    color: 'var(--cat-dining)',
  },
  {
    label: 'Rozrywka',
    spent: 890,
    limit: 500,
    color: 'var(--cat-entertainment)',
  },
  {
    label: 'Rachunki',
    spent: 450,
    limit: 600,
    color: 'var(--cat-bills)',
  },
];

export const useBudgetQuery = (): BudgetQueryResult => ({
  data: MOCK_DATA,
  isLoading: false,
});
