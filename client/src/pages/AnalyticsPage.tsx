import {
  AnalyticsChart,
  AnalyticsKpiRow,
  AnalyticsToolbar,
  useAnalyticsFilters,
  useAnalyticsQuery,
} from '#features/analytics';
import { QueryRenderer } from '#shared/ui/QueryRenderer';

export const AnalyticsPage = (): React.JSX.Element => {
  const { filters, setFilters } = useAnalyticsFilters();
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
