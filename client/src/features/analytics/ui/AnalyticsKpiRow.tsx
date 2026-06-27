import { Card } from '#shared/ui/Card';

import type { AnalyticsKpi } from '#features/analytics/model/types';

interface AnalyticsKpiRowProps {
  readonly kpis: AnalyticsKpi[];
}

const TREND_CLASS: Record<AnalyticsKpi['trend'], string> = {
  up: 'text-income',
  down: 'text-expense',
  neutral: 'text-muted-foreground',
};

export const AnalyticsKpiRow = ({ kpis }: AnalyticsKpiRowProps): React.JSX.Element => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {kpis.map((kpi) => (
      <Card key={kpi.label}>
        <div className="flex flex-col gap-1 p-4">
          <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
          <span className={`font-mono text-lg font-semibold tabular-nums ${TREND_CLASS[kpi.trend]}`}>
            {kpi.value}
          </span>
          <span className={`text-xs font-medium ${TREND_CLASS[kpi.trend]}`}>
            {kpi.delta} vs poprzedni okres
          </span>
        </div>
      </Card>
    ))}
  </div>
);
