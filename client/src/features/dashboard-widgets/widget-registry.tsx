import type { ComponentType } from 'react';

import { QueryRenderer } from '#shared/ui/QueryRenderer';
import { Skeleton } from '#shared/ui/Skeleton';

import { useBudgetProgressWidget } from '#features/dashboard-widgets/ui/hooks/useBudgetProgressWidget';
import { useCategoryDonutWidget } from '#features/dashboard-widgets/ui/hooks/useCategoryDonutWidget';
import { useKpiWidget } from '#features/dashboard-widgets/ui/hooks/useKpiWidget';
import { useRecentTransactionsWidget } from '#features/dashboard-widgets/ui/hooks/useRecentTransactionsWidget';
import { useTrendChartWidget } from '#features/dashboard-widgets/ui/hooks/useTrendChartWidget';

import { BudgetProgressWidget } from '#features/dashboard-widgets/ui/BudgetProgressWidget';
import { CategoryDonutWidget } from '#features/dashboard-widgets/ui/CategoryDonutWidget';
import { KpiRowWidget } from '#features/dashboard-widgets/ui/KpiRowWidget';
import { RecentTransactionsWidget } from '#features/dashboard-widgets/ui/RecentTransactionsWidget';
import { TrendChartWidget } from '#features/dashboard-widgets/ui/TrendChartWidget';

export enum WidgetType {
  KpiRow = 'KpiRow',
  TrendChart = 'TrendChart',
  CategoryDonut = 'CategoryDonut',
  BudgetProgress = 'BudgetProgress',
  RecentTransactions = 'RecentTransactions',
}

interface WidgetConfig {
  readonly id: WidgetType;
  readonly cols: 1 | 2 | 4;
  readonly Component: ComponentType;
}

const KpiRowEntry = (): React.JSX.Element => {
  const state = useKpiWidget();
  return (
    <QueryRenderer state={state} skeleton={<Skeleton className="h-24 w-full" />}>
      {(items) => <KpiRowWidget items={items} />}
    </QueryRenderer>
  );
};

const TrendChartEntry = (): React.JSX.Element => {
  const state = useTrendChartWidget();
  return (
    <QueryRenderer state={state}>
      {(data) => <TrendChartWidget data={data} title="Przychody vs Wydatki" subtitle="Ostatnie 6 miesięcy" />}
    </QueryRenderer>
  );
};

const CategoryDonutEntry = (): React.JSX.Element => {
  const state = useCategoryDonutWidget();
  return (
    <QueryRenderer state={state}>
      {(data) => <CategoryDonutWidget data={data} title="Wydatki wg kategorii" subtitle="Bieżący miesiąc" />}
    </QueryRenderer>
  );
};

const BudgetProgressEntry = (): React.JSX.Element => {
  const state = useBudgetProgressWidget();
  return (
    <QueryRenderer state={state}>
      {(data) => <BudgetProgressWidget items={data} title="Budżety" subtitle="Czerwiec 2025" currency="PLN" />}
    </QueryRenderer>
  );
};

const RecentTransactionsEntry = (): React.JSX.Element => {
  const state = useRecentTransactionsWidget();
  return (
    <QueryRenderer state={state}>
      {(data) => <RecentTransactionsWidget transactions={data} title="Ostatnie transakcje" />}
    </QueryRenderer>
  );
};

export const WIDGET_REGISTRY: WidgetConfig[] = [
  { id: WidgetType.KpiRow, cols: 4, Component: KpiRowEntry },
  { id: WidgetType.TrendChart, cols: 2, Component: TrendChartEntry },
  { id: WidgetType.CategoryDonut, cols: 2, Component: CategoryDonutEntry },
  { id: WidgetType.BudgetProgress, cols: 2, Component: BudgetProgressEntry },
  { id: WidgetType.RecentTransactions, cols: 2, Component: RecentTransactionsEntry },
];
