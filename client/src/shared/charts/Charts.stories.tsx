import type { Meta, StoryObj } from '@storybook/react';

import { BarChart, LineChart, PieChart } from '#shared/charts';
import { Card, CardHeader } from '#shared/ui/Card';

const meta: Meta = {
  title: 'shared/charts/Charts',
};

export default meta;
type Story = StoryObj;

const INCOME_DATA = [
  { x: 'Sty', y: 8500 },
  { x: 'Lut', y: 8500 },
  { x: 'Mar', y: 8700 },
  { x: 'Kwi', y: 9200 },
  { x: 'Maj', y: 8500 },
  { x: 'Cze', y: 8500 },
];

const EXPENSE_DATA = [
  { x: 'Sty', y: 5800 },
  { x: 'Lut', y: 6200 },
  { x: 'Mar', y: 5900 },
  { x: 'Kwi', y: 7100 },
  { x: 'Maj', y: 5600 },
  { x: 'Cze', y: 6240 },
];

const CATEGORY_DATA = [
  { label: 'Zakupy', value: 1820 },
  { label: 'Rachunki', value: 1460 },
  { label: 'Transport', value: 1140 },
  { label: 'Jedzenie', value: 680 },
  { label: 'Rozrywka', value: 600 },
  { label: 'Subskrypcje', value: 540 },
];

const CHART_COLORS = ['#34d399', '#94a3b8', '#60a5fa', '#fbbf24', '#fb7185', '#a78bfa'];

export const Showcase: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Line chart</h3>
        <Card className="w-[600px]">
          <CardHeader title="Przychody vs wydatki" subtitle="Ostatnie 6 miesięcy" />
          <LineChart
            data={[
              { id: 'Przychód', data: INCOME_DATA },
              { id: 'Wydatek', data: EXPENSE_DATA },
            ]}
            height={250}
            colors={['#34d399', '#3b82f6']}
            showLegend
            showGrid
          />
        </Card>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Bar chart</h3>
        <Card className="w-[500px]">
          <CardHeader title="Wydatki wg kategorii" subtitle="Czerwiec 2026" />
          <BarChart
            data={CATEGORY_DATA}
            height={250}
            colors={CHART_COLORS}
            showGrid
          />
        </Card>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Pie chart</h3>
        <Card className="w-[400px]">
          <CardHeader title="Struktura wydatków" subtitle="Czerwiec 2026" />
          <PieChart
            data={CATEGORY_DATA}
            height={250}
            colors={CHART_COLORS}
            showLegend
          />
        </Card>
      </section>
    </div>
  ),
};
