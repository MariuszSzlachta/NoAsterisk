import { getSeriesColors } from '#features/analytics/model/getSeriesColors';
import type { AnalyticsSeries } from '#features/analytics/model/types';
import { LineChart } from '#shared/adapters/charts';
import { Card } from '#shared/ui/Card';

interface AnalyticsChartProps {
  readonly series: AnalyticsSeries[];
}

/**
 * Renders analytics chart data as a line chart.
 * Additional chart types (bar, area) will be implemented when shared adapters exist.
 */
export const AnalyticsChart = ({
  series,
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
