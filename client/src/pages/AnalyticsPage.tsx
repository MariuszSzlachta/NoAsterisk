import { useMemo } from 'react';

import {
  AnalyticsCategoryBreakdown,
  AnalyticsChart,
  AnalyticsKpiRow,
  AnalyticsToolbar,
  useAnalyticsFilters,
  useAnalyticsQuery,
  type CategoryBreakdownFilters,
} from '#features/analytics';
import { QueryRenderer } from '#shared/ui/QueryRenderer';

const BREAKDOWN_METRICS = ['expenses', 'income'] as const;

export const AnalyticsPage = (): React.JSX.Element => {
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

  return (
    <div className="flex flex-col gap-6">
      <AnalyticsToolbar filters={filters} onFiltersChange={setFilters} />
      <QueryRenderer state={state}>
        {(data) => (
          <div className="flex flex-col gap-6">
            <AnalyticsChart
              series={data.series}
              chartType={filters.chartType}
            />
            <AnalyticsKpiRow kpis={data.kpis} />
            {breakdownFilters !== undefined ? (
              <AnalyticsCategoryBreakdown filters={breakdownFilters} />
            ) : null}
          </div>
        )}
      </QueryRenderer>
    </div>
  );
};
