import { BudgetProgressList } from '#shared/ui/BudgetProgressList';
import { Card, CardHeader } from '#shared/ui/Card';
import { CategoryDonutWidget } from '#pages/dashboard/widgets/CategoryDonutWidget';
import { KpiRowWidget } from '#pages/dashboard/widgets/KpiRowWidget';
import { RecentTransactionsWidget } from '#pages/dashboard/widgets/RecentTransactionsWidget';
import { TrendChartWidget } from '#pages/dashboard/widgets/TrendChartWidget';

const BUDGET_ITEMS = [
  { label: 'Zakupy spożywcze', spent: 1850, limit: 2000, color: 'var(--cat-groceries)' },
  { label: 'Transport', spent: 620, limit: 800, color: 'var(--cat-transport)' },
  { label: 'Subskrypcje', spent: 340, limit: 350, color: 'var(--cat-subscriptions)' },
  { label: 'Jedzenie na mieście', spent: 890, limit: 1000, color: 'var(--cat-dining)' },
];

export const DashboardPage = (): React.JSX.Element => (
  <div className="flex flex-col gap-6">
    <KpiRowWidget />
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <TrendChartWidget />
      <CategoryDonutWidget />
    </div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Budżety" subtitle="Czerwiec 2025" />
        <BudgetProgressList items={BUDGET_ITEMS} currency="PLN" />
      </Card>
      <RecentTransactionsWidget />
    </div>
  </div>
);
