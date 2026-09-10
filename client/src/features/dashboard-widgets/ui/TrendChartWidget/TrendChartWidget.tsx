import type { ReactNode } from 'react';

import { LineChart, type ChartSeries } from '#shared/adapters/charts';
import { DASHBOARD_WIDGET_HEADER_RESPONSIVE_CLASS } from '#features/dashboard-widgets/ui/constants';
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
  <Card
    className={DASHBOARD_WIDGET_HEADER_RESPONSIVE_CLASS}
  >
    <CardHeader title={title} subtitle={subtitle} action={action} />
    <LineChart
      data={data}
      height={260}
      compactOnMobile
      colors={['var(--income)', 'var(--expense)']}
      showGrid
      showLegend
      axisBottom={{ label: '' }}
    />
  </Card>
);
