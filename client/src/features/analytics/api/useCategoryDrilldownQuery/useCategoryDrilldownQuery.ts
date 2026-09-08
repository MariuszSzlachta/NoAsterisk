import { computeCategoryDrilldown } from '#features/analytics/model/category-drilldown';
import { getDateRange } from '#features/analytics/model/date-range';
import type {
  CategoryBreakdownFilters,
  CategoryDrilldownData,
} from '#features/analytics/model/types';
import { useTransactionsStore } from '#entities/transaction';
import type { QueryState } from '#shared/api';

// ARCH-EXCEPTION: cross-feature import — read-only access to useTransactionsStore public API.
// Analytics needs transaction data for drilldown. Planned resolution: migrate to TanStack Query
// with real API when backend provides aggregation endpoints.

/**
 * Provides category drilldown data (trend + recent transactions) computed from local transactions.
 * Delegates all computation to model/category-drilldown.
 */
export const useCategoryDrilldownQuery = (
  category: string,
  filters: CategoryBreakdownFilters,
): QueryState<CategoryDrilldownData> => {
  const transactions = useTransactionsStore((s) => s.transactions);
  const dateRange = getDateRange(filters.period);
  const data = computeCategoryDrilldown(transactions, category, dateRange, filters.metric);

  return { status: 'loaded', data };
};
