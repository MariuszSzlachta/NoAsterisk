import type { ComponentType } from 'react';

export enum WidgetType {
  KpiRow = 'KpiRow',
  TrendChart = 'TrendChart',
  CategoryDonut = 'CategoryDonut',
  RecentTransactions = 'RecentTransactions',
  BudgetProgress = 'BudgetProgress',
}

export interface WidgetSize {
  readonly cols: number;
  readonly rows: number;
}

export interface DashboardWidget {
  readonly id: WidgetType;
  readonly defaultSize: WidgetSize;
  readonly minSize: WidgetSize;
  readonly component: ComponentType;
}
