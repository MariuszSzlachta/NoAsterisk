import type { ChartDataPoint } from '#shared/adapters/charts';
import { PieChart } from '#shared/adapters/charts';
import { Card, CardHeader } from '#shared/ui/Card';

const useCategoryData = (): ChartDataPoint[] => [
  { label: 'Zakupy', value: 1850 },
  { label: 'Transport', value: 620 },
  { label: 'Subskrypcje', value: 340 },
  { label: 'Jedzenie', value: 890 },
  { label: 'Rachunki', value: 1450 },
  { label: 'Rozrywka', value: 900 },
];

const CATEGORY_COLORS = [
  'var(--cat-groceries)',
  'var(--cat-transport)',
  'var(--cat-subscriptions)',
  'var(--cat-dining)',
  'var(--cat-bills)',
  'var(--cat-entertainment)',
];

export const CategoryDonutWidget = (): React.JSX.Element => {
  const data = useCategoryData();

  return (
    <Card>
      <CardHeader title="Wydatki wg kategorii" subtitle="Bieżący miesiąc" />
      <PieChart data={data} height={260} colors={CATEGORY_COLORS} showLegend />
    </Card>
  );
};
