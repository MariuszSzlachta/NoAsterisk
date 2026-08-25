import {
  AnalyticsCategoryBreakdown,
  AnalyticsChart,
  AnalyticsKpiRow,
  AnalyticsToolbar,
} from '#features/analytics';
import { QueryRenderer } from '#shared/ui/QueryRenderer';

import { useAnalyticsPageData } from '#pages/AnalyticsPage/useAnalyticsPageData';

// ─── Page ────────────────────────────────────────────────────────

export const AnalyticsPage = (): React.JSX.Element => {
  const { filters, setFilters, state, breakdownFilters } = useAnalyticsPageData();

  return (
    <div className="flex flex-col gap-6">
      <AnalyticsToolbar filters={filters} onFiltersChange={setFilters} />
      <QueryRenderer state={state}>
        {(data) => (
          <div className="flex flex-col gap-6">
            <AnalyticsChart
              series={data.series}
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
