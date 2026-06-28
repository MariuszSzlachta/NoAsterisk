import type {
  CategoryBreakdownFilters,
  CategoryBreakdownItem,
} from '#features/analytics/model/types';
import type { QueryState } from '#shared/api';

const MOCK_EXPENSES_BREAKDOWN: CategoryBreakdownItem[] = [
  { category: 'Żywność', amount: 2150, percentage: 30 },
  { category: 'Transport', amount: 1430, percentage: 20 },
  { category: 'Subskrypcje', amount: 1070, percentage: 15 },
  { category: 'Jedzenie na mieście', amount: 860, percentage: 12 },
  { category: 'Rachunki', amount: 930, percentage: 13 },
  { category: 'Rozrywka', amount: 710, percentage: 10 },
];

const MOCK_INCOME_BREAKDOWN: CategoryBreakdownItem[] = [
  { category: 'Wynagrodzenie', amount: 7000, percentage: 82 },
  { category: 'Freelance', amount: 1000, percentage: 12 },
  { category: 'Inne', amount: 500, percentage: 6 },
];

export const useCategoryBreakdownQuery = (
  _filters: CategoryBreakdownFilters,
): QueryState<CategoryBreakdownItem[]> => {
  const data =
    _filters.metric === 'expenses'
      ? MOCK_EXPENSES_BREAKDOWN
      : MOCK_INCOME_BREAKDOWN;

  return { status: 'loaded', data };
};
