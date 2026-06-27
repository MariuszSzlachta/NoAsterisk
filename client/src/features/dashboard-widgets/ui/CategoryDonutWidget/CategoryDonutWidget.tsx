import type { ChartDataPoint } from '#shared/adapters/charts';
import { PieChart } from '#shared/adapters/charts';
import { Card, CardHeader } from '#shared/ui/Card';

const CATEGORY_COLORS = [
  'var(--cat-groceries)',
  'var(--cat-transport)',
  'var(--cat-subscriptions)',
  'var(--cat-dining)',
  'var(--cat-bills)',
  'var(--cat-entertainment)',
];

interface CategoryDonutWidgetProps {
  readonly data: ChartDataPoint[];
  readonly title: string;
  readonly subtitle?: string;
}

export const CategoryDonutWidget = ({ data, title, subtitle }: CategoryDonutWidgetProps): React.JSX.Element => (
  <Card>
    <CardHeader title={title} subtitle={subtitle} />
    <PieChart data={data} height={260} colors={CATEGORY_COLORS} showLegend />
  </Card>
);
