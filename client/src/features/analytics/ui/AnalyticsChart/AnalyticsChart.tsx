import { getSeriesColors } from '#features/analytics/model/getSeriesColors';
import type {
  AnalyticsSeries,
  ChartType,
} from '#features/analytics/model/types';
import { LineChart } from '#shared/adapters/charts';
import { Card } from '#shared/ui/Card';

interface AnalyticsChartProps {
  readonly series: AnalyticsSeries[];
  readonly chartType: ChartType;
}

// TODO: switch chart renderer based on chartType (bar/area) when BarChart/AreaChart adapters exist
export const AnalyticsChart = ({
  series,
  chartType: _chartType,
}: AnalyticsChartProps): React.JSX.Element => (
  <Card>
    <div className="p-4">
      <LineChart
        data={series}
        height={320}
        colors={getSeriesColors(series.map((s) => s.id))}
        showGrid
        showLegend
        axisBottom={{ label: '' }}
      />
    </div>
  </Card>
);
