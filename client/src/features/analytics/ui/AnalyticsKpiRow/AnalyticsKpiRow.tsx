import { getTrendClass } from '#features/analytics/model/getTrendClass';
import type { AnalyticsKpi } from '#features/analytics/model/types';
import { Card } from '#shared/ui/Card';

interface AnalyticsKpiRowProps {
  readonly kpis: AnalyticsKpi[];
}

export const AnalyticsKpiRow = ({
  kpis,
}: AnalyticsKpiRowProps): React.JSX.Element => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {kpis.map((kpi) => (
      <Card key={kpi.label}>
        <div className="flex flex-col gap-1 p-4">
          <span className="text-xs font-medium text-muted-foreground">
            {kpi.label}
          </span>
          <span
            className={`font-mono text-lg font-semibold tabular-nums ${getTrendClass(kpi.trend, kpi.invertColor)}`}
          >
            {kpi.value}
          </span>
          <span className={`text-xs font-medium ${getTrendClass(kpi.trend, kpi.invertColor)}`}>
            {kpi.delta} vs poprzedni okres
          </span>
        </div>
      </Card>
    ))}
  </div>
);
