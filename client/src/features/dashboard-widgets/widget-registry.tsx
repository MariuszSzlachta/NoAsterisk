import type { ComponentType } from 'react';

import { BudgetProgressConnected } from '#features/dashboard-widgets/ui/connected/BudgetProgressConnected';
import { CategoryDonutConnected } from '#features/dashboard-widgets/ui/connected/CategoryDonutConnected';
import { KpiRowConnected } from '#features/dashboard-widgets/ui/connected/KpiRowConnected';
import { RecentTransactionsConnected } from '#features/dashboard-widgets/ui/connected/RecentTransactionsConnected';
import { TrendChartConnected } from '#features/dashboard-widgets/ui/connected/TrendChartConnected';

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

export const WIDGET_REGISTRY: WidgetConfig[] = [
  { id: WidgetType.KpiRow, cols: 4, Component: KpiRowConnected },
  { id: WidgetType.TrendChart, cols: 2, Component: TrendChartConnected },
  { id: WidgetType.CategoryDonut, cols: 2, Component: CategoryDonutConnected },
  { id: WidgetType.BudgetProgress, cols: 2, Component: BudgetProgressConnected },
  { id: WidgetType.RecentTransactions, cols: 2, Component: RecentTransactionsConnected },
];
