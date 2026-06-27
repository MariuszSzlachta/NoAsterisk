import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { QueryRenderer } from '#shared/ui/QueryRenderer';

import type { AnalyticsFilters, MetricType } from '#features/analytics';
import { AnalyticsChart, AnalyticsKpiRow, AnalyticsToolbar, useAnalyticsQuery } from '#features/analytics';

const parseMetrics = (param: string | null): MetricType[] => {
  if (!param) return ['expenses'];
  const valid: MetricType[] = ['balance', 'income', 'expenses', 'savings'];
  const parsed = param.split(',').filter((m): m is MetricType => valid.includes(m as MetricType));
  return parsed.length > 0 ? parsed : ['expenses'];
};

export const AnalyticsPage = (): React.JSX.Element => {
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState<AnalyticsFilters>({
    metrics: parseMetrics(searchParams.get('metric')),
    period: '6m',
    chartType: 'line',
    granularity: 'monthly',
  });

  const state = useAnalyticsQuery(filters);

  return (
    <div className="flex flex-col gap-6">
      <AnalyticsToolbar filters={filters} onFiltersChange={setFilters} />
      <QueryRenderer state={state}>
        {(data) => (
          <div className="flex flex-col gap-6">
            <AnalyticsChart series={data.series} chartType={filters.chartType} />
            <AnalyticsKpiRow kpis={data.kpis} />
          </div>
        )}
      </QueryRenderer>
    </div>
  );
};
