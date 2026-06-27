import type { ChartSeries } from '#shared/adapters/charts';
import { LineChart } from '#shared/adapters/charts';
import { Card, CardHeader } from '#shared/ui/Card';

interface TrendChartWidgetProps {
  readonly data: ChartSeries[];
  readonly title: string;
  readonly subtitle?: string;
}

export const TrendChartWidget = ({ data, title, subtitle }: TrendChartWidgetProps): React.JSX.Element => (
  <Card>
    <CardHeader title={title} subtitle={subtitle} />
    <LineChart
      data={data}
      height={260}
      colors={['var(--income)', 'var(--expense)']}
      showGrid
      showLegend
      axisBottom={{ label: '' }}
      axisLeft={{ label: 'PLN' }}
    />
  </Card>
);
