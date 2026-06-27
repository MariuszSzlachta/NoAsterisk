import { CategoryDonutWidget } from '#pages/dashboard/widgets/CategoryDonutWidget';
import { KpiRowWidget } from '#pages/dashboard/widgets/KpiRowWidget';
import { RecentTransactionsWidget } from '#pages/dashboard/widgets/RecentTransactionsWidget';
import { TrendChartWidget } from '#pages/dashboard/widgets/TrendChartWidget';
import type { DashboardWidget } from '#pages/dashboard/widget.types';
import { WidgetType } from '#pages/dashboard/widget.types';

export const WIDGET_REGISTRY: Record<WidgetType, DashboardWidget> = {
  [WidgetType.KpiRow]: {
    id: WidgetType.KpiRow,
    defaultSize: { cols: 4, rows: 1 },
    minSize: { cols: 2, rows: 1 },
    component: KpiRowWidget,
  },
  [WidgetType.TrendChart]: {
    id: WidgetType.TrendChart,
    defaultSize: { cols: 2, rows: 2 },
    minSize: { cols: 2, rows: 2 },
    component: TrendChartWidget,
  },
  [WidgetType.CategoryDonut]: {
    id: WidgetType.CategoryDonut,
    defaultSize: { cols: 2, rows: 2 },
    minSize: { cols: 1, rows: 2 },
    component: CategoryDonutWidget,
  },
  [WidgetType.RecentTransactions]: {
    id: WidgetType.RecentTransactions,
    defaultSize: { cols: 2, rows: 2 },
    minSize: { cols: 2, rows: 2 },
    component: RecentTransactionsWidget,
  },
  [WidgetType.BudgetProgress]: {
    id: WidgetType.BudgetProgress,
    defaultSize: { cols: 2, rows: 2 },
    minSize: { cols: 1, rows: 2 },
    component: () => null,
  },
};
