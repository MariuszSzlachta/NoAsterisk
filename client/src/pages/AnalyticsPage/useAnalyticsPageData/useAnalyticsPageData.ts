import { useMemo } from 'react';

import {
  useAnalyticsFilters,
  useAnalyticsQuery,
  type AnalyticsFilters,
  type CategoryBreakdownFilters,
} from '#features/analytics';
import type {
  AnalyticsKpi,
  AnalyticsSeries,
} from '#features/analytics/model/types';
import type { QueryState } from '#shared/api';

// ─── Constants ───────────────────────────────────────────────────

const isBreakdownMetric = (value: string): value is 'expenses' | 'income' =>
  value === 'expenses' || value === 'income';

// ─── Types ───────────────────────────────────────────────────────

interface AnalyticsQueryData {
  readonly series: AnalyticsSeries[];
  readonly kpis: AnalyticsKpi[];
}

interface UseAnalyticsPageDataResult {
  readonly filters: AnalyticsFilters;
  readonly setFilters: (filters: AnalyticsFilters) => void;
  readonly state: QueryState<AnalyticsQueryData>;
  readonly breakdownFilters: CategoryBreakdownFilters | undefined;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useAnalyticsPageData = (): UseAnalyticsPageDataResult => {
  const { filters, setFilters } = useAnalyticsFilters();
  const state = useAnalyticsQuery(filters);

  const breakdownMetric = filters.metrics.find(
    isBreakdownMetric,
  );

  const breakdownFilters: CategoryBreakdownFilters | undefined = useMemo(
    () =>
      breakdownMetric !== undefined
        ? {
            metric: breakdownMetric,
            period: filters.period,
            granularity: filters.granularity,
          }
        : undefined,
    [breakdownMetric, filters.period, filters.granularity],
  );

  return {
    filters,
    setFilters,
    state,
    breakdownFilters,
  };
};
