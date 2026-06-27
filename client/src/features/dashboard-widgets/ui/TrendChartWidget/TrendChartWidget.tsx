import type { ReactNode } from 'react';

import { LineChart, type ChartSeries } from '#shared/adapters/charts';
import { Card, CardHeader } from '#shared/ui/Card';

interface TrendChartWidgetProps {
  readonly data: ChartSeries[];
  readonly title: string;
  readonly subtitle?: string;
  readonly action?: ReactNode;
}

export const TrendChartWidget = ({
  data,
  title,
  subtitle,
  action,
}: TrendChartWidgetProps): React.JSX.Element => (
  <Card>
    <CardHeader title={title} subtitle={subtitle} action={action} />
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
