import { useMemo } from 'react';

import {
  useAnalyticsFilters,
  useAnalyticsQuery,
  type AnalyticsFilters,
  type CategoryBreakdownFilters,
} from '#features/analytics';
import type { QueryState } from '#shared/api';

// ─── Constants ───────────────────────────────────────────────────

const BREAKDOWN_METRICS = ['expenses', 'income'] as const;

// ─── Types ───────────────────────────────────────────────────────

interface AnalyticsQueryData {
  readonly series: ReadonlyArray<unknown>;
  readonly kpis: ReadonlyArray<unknown>;
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
    (m): m is 'expenses' | 'income' =>
      BREAKDOWN_METRICS.includes(m as (typeof BREAKDOWN_METRICS)[number]),
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
