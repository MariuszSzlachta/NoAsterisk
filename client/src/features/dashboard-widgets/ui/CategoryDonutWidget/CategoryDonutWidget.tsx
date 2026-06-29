import type { ReactNode } from 'react';

import { LegendRow } from '#features/dashboard-widgets/ui/CategoryDonutWidget/LegendRow';
import { useCategoryLegend } from '#features/dashboard-widgets/ui/CategoryDonutWidget/useCategoryLegend';
import { PieChart, type ChartDataPoint } from '#shared/adapters/charts';
import { Card, CardHeader } from '#shared/ui/Card';

const CATEGORY_COLORS = [
  'var(--cat-groceries)',
  'var(--cat-transport)',
  'var(--cat-subscriptions)',
  'var(--cat-dining)',
  'var(--cat-bills)',
  'var(--cat-entertainment)',
  'var(--fg-subtle)',
];

const DONUT_HEIGHT = 180;

interface CategoryDonutWidgetProps {
  readonly data: ChartDataPoint[];
  readonly title: string;
  readonly subtitle?: string;
  readonly action?: ReactNode;
}

export const CategoryDonutWidget = ({
  data,
  title,
  subtitle,
  action,
}: CategoryDonutWidgetProps): React.JSX.Element => {
  const legendItems = useCategoryLegend(data, CATEGORY_COLORS);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader title={title} subtitle={subtitle} action={action} />
        <p className="py-8 text-center text-sm text-muted-foreground">
          Brak danych o wydatkach
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} action={action} />
      <div className="flex flex-1 items-center gap-6">
        <div className="h-[180px] w-[180px] shrink-0">
          <PieChart
            data={data}
            height={DONUT_HEIGHT}
            colors={CATEGORY_COLORS}
          />
        </div>
        <ul
          className="flex flex-1 flex-col gap-0.5 overflow-y-auto"
          style={{ maxHeight: 180 }}
        >
          {legendItems.map((item) => (
            <LegendRow key={item.label} item={item} />
          ))}
        </ul>
      </div>
    </Card>
  );
};
