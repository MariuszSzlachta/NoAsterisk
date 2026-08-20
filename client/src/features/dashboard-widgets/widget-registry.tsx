import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';

import { BudgetProgressWidget } from '#features/dashboard-widgets/ui/BudgetProgressWidget';
import { CategoryDonutWidget } from '#features/dashboard-widgets/ui/CategoryDonutWidget';
import { useBudgetProgressWidget } from '#features/dashboard-widgets/ui/hooks/useBudgetProgressWidget';
import { useCategoryDonutWidget } from '#features/dashboard-widgets/ui/hooks/useCategoryDonutWidget';
import { useKpiWidget } from '#features/dashboard-widgets/ui/hooks/useKpiWidget';
import { useRecentTransactionsWidget } from '#features/dashboard-widgets/ui/hooks/useRecentTransactionsWidget';
import { useRecurringExpensesWidget } from '#features/dashboard-widgets/ui/hooks/useRecurringExpensesWidget';
import { useSavingsRateWidget } from '#features/dashboard-widgets/ui/hooks/useSavingsRateWidget';
import { useTrendChartWidget } from '#features/dashboard-widgets/ui/hooks/useTrendChartWidget';
import { KpiRowWidget } from '#features/dashboard-widgets/ui/KpiRowWidget';
import { RecentTransactionsWidget } from '#features/dashboard-widgets/ui/RecentTransactionsWidget';
import { RecurringExpensesWidget } from '#features/dashboard-widgets/ui/RecurringExpensesWidget';
import { SavingsRateWidget } from '#features/dashboard-widgets/ui/SavingsRateWidget';
import { TrendChartWidget } from '#features/dashboard-widgets/ui/TrendChartWidget';
import { QueryRenderer } from '#shared/ui/QueryRenderer';
import { Skeleton } from '#shared/ui/Skeleton';

export enum WidgetType {
  KpiRow = 'KpiRow',
  TrendChart = 'TrendChart',
  CategoryDonut = 'CategoryDonut',
  SavingsRate = 'SavingsRate',
  BudgetProgress = 'BudgetProgress',
  RecentTransactions = 'RecentTransactions',
  RecurringExpenses = 'RecurringExpenses',
}

interface WidgetConfig {
  readonly id: WidgetType;
  readonly cols: 1 | 2 | 3 | 4;
  readonly Component: ComponentType;
}

const WidgetLink = ({
  to,
  children,
}: {
  to: string;
  children: string;
}): React.JSX.Element => (
  <Link
    to={to}
    className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
  >
    {children}
  </Link>
);

const KpiRowEntry = (): React.JSX.Element => {
  const state = useKpiWidget();
  return (
    <QueryRenderer
      state={state}
      skeleton={<Skeleton className="h-24 w-full" />}
    >
      {(items) => <KpiRowWidget items={items} />}
    </QueryRenderer>
  );
};

const TrendChartEntry = (): React.JSX.Element => {
  const state = useTrendChartWidget();
  return (
    <QueryRenderer state={state}>
      {(data) => (
        <TrendChartWidget
          data={data}
          title="Przychody vs Wydatki"
          subtitle="Ostatnie 6 miesięcy"
          action={
            <WidgetLink to="/analytics?metric=income,expenses">
              Analiza →
            </WidgetLink>
          }
        />
      )}
    </QueryRenderer>
  );
};

const CategoryDonutEntry = (): React.JSX.Element => {
  const state = useCategoryDonutWidget();
  return (
    <QueryRenderer state={state}>
      {(data) => (
        <CategoryDonutWidget
          data={data}
          title="Wydatki wg kategorii"
          subtitle="Bieżący miesiąc"
          action={
            <WidgetLink to="/analytics?metric=expenses">Analiza →</WidgetLink>
          }
        />
      )}
    </QueryRenderer>
  );
};

const SavingsRateEntry = (): React.JSX.Element => {
  const state = useSavingsRateWidget();
  return (
    <QueryRenderer state={state}>
      {(data) => (
        <SavingsRateWidget
          data={data}
          title="Stopa oszczędności"
          subtitle="Bieżący miesiąc"
        />
      )}
    </QueryRenderer>
  );
};

const BudgetProgressEntry = (): React.JSX.Element => {
  const state = useBudgetProgressWidget();
  const currentMonthLabel = new Date().toLocaleString('pl-PL', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <QueryRenderer state={state}>
      {(data) => (
        <BudgetProgressWidget
          items={data}
          title="Budżety"
          subtitle={currentMonthLabel}
          currency="PLN"
          action={<WidgetLink to="/budgets">Wszystkie →</WidgetLink>}
        />
      )}
    </QueryRenderer>
  );
};

const RecentTransactionsEntry = (): React.JSX.Element => {
  const state = useRecentTransactionsWidget();
  return (
    <QueryRenderer state={state}>
      {(data) => (
        <RecentTransactionsWidget
          transactions={data}
          title="Ostatnie transakcje"
          action={<WidgetLink to="/transactions">Wszystkie →</WidgetLink>}
        />
      )}
    </QueryRenderer>
  );
};

const RecurringExpensesEntry = (): React.JSX.Element => {
  const state = useRecurringExpensesWidget();
  return (
    <QueryRenderer state={state}>
      {(data) => (
        <RecurringExpensesWidget
          data={data}
          title="Stałe wydatki"
          subtitle="Subskrypcje i opłaty"
          action={
            <WidgetLink to="/transactions?filter=recurring">
              Wszystkie →
            </WidgetLink>
          }
        />
      )}
    </QueryRenderer>
  );
};

export const WIDGET_REGISTRY: WidgetConfig[] = [
  { id: WidgetType.KpiRow, cols: 4, Component: KpiRowEntry },
  { id: WidgetType.TrendChart, cols: 2, Component: TrendChartEntry },
  { id: WidgetType.CategoryDonut, cols: 1, Component: CategoryDonutEntry },
  { id: WidgetType.SavingsRate, cols: 1, Component: SavingsRateEntry },
  { id: WidgetType.BudgetProgress, cols: 2, Component: BudgetProgressEntry },
  {
    id: WidgetType.RecentTransactions,
    cols: 2,
    Component: RecentTransactionsEntry,
  },
  {
    id: WidgetType.RecurringExpenses,
    cols: 2,
    Component: RecurringExpensesEntry,
  },
];
