import { computeCategoryBreakdown } from '#features/analytics/model/category-breakdown';
import { getDateRange } from '#features/analytics/model/date-range';
import type {
  CategoryBreakdownFilters,
  CategoryBreakdownItem,
} from '#features/analytics/model/types';
import { useTransactionsStore } from '#entities/transaction';
import type { QueryState } from '#shared/api';

// ARCH-EXCEPTION: cross-feature import — read-only access to useTransactionsStore public API.
// Analytics needs transaction data for category breakdown. Planned resolution: migrate to TanStack
// Query with real API when backend provides aggregation endpoints.

/**
 * Provides category breakdown data computed from local transactions.
 * Delegates all computation to model/category-breakdown.
 */
export const useCategoryBreakdownQuery = (
  filters: CategoryBreakdownFilters,
): QueryState<CategoryBreakdownItem[]> => {
  const transactions = useTransactionsStore((s) => s.transactions);
  const dateRange = getDateRange(filters.period);
  const data = computeCategoryBreakdown(transactions, dateRange, filters.metric);

  return { status: 'loaded', data };
};
