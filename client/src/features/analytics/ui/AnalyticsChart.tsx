import { LineChart } from '#shared/adapters/charts';
import { Card } from '#shared/ui/Card';

import type { AnalyticsSeries, ChartType } from '#features/analytics/model/types';

interface AnalyticsChartProps {
  readonly series: AnalyticsSeries[];
  readonly chartType: ChartType;
}

const SERIES_COLOR: Record<string, string> = {
  Saldo: 'var(--primary)',
  Przychody: 'var(--income)',
  Wydatki: 'var(--expense)',
  Oszczędności: 'var(--warning)',
};

// TODO: switch chart renderer based on chartType (bar/area) when BarChart/AreaChart adapters exist
export const AnalyticsChart = ({ series, chartType: _chartType }: AnalyticsChartProps): React.JSX.Element => {
  const colors = series.map((s) => SERIES_COLOR[s.id] ?? 'var(--primary)');

  return (
    <Card>
      <div className="p-4">
        <LineChart
          data={series}
          height={320}
          colors={colors}
          showGrid
          showLegend
          axisBottom={{ label: '' }}
          axisLeft={{ label: 'PLN' }}
        />
      </div>
    </Card>
  );
};
