import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  AnalyticsChart,
  AnalyticsKpiRow,
  AnalyticsToolbar,
  parseMetricsParam,
  useAnalyticsQuery,
  type AnalyticsFilters,
} from '#features/analytics';
import { QueryRenderer } from '#shared/ui/QueryRenderer';

export const AnalyticsPage = (): React.JSX.Element => {
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState<AnalyticsFilters>({
    metrics: parseMetricsParam(searchParams.get('metric')),
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
            <AnalyticsChart
              series={data.series}
              chartType={filters.chartType}
            />
            <AnalyticsKpiRow kpis={data.kpis} />
          </div>
        )}
      </QueryRenderer>
    </div>
  );
};
