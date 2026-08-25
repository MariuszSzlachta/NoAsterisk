import type {
  ChartSeries,
  ChartSeriesDataPoint,
} from '#shared/adapters/charts';

export type MetricType = 'balance' | 'income' | 'expenses' | 'savings';

export type Period = '1m' | '3m' | '6m' | '1y' | 'ytd';

export type ChartType = 'line' | 'bar' | 'area';

export type Granularity = 'daily' | 'weekly' | 'monthly';

export interface AnalyticsFilters {
  readonly metrics: MetricType[];
  readonly period: Period;
  readonly chartType: ChartType;
  readonly granularity: Granularity;
}

export type AnalyticsDataPoint = ChartSeriesDataPoint;
export type AnalyticsSeries = ChartSeries;

export interface AnalyticsKpi {
  readonly label: string;
  readonly value: string;
  readonly delta: string;
  readonly trend: 'up' | 'down' | 'neutral';
  readonly invertColor?: boolean;
}

export interface CategoryBreakdownItem {
  readonly categoryId: string;
  readonly category: string;
  readonly amount: number;
  readonly percentage: number;
}

export interface CategoryDrilldownTransaction {
  readonly id: string;
  readonly title: string;
  readonly amount: number;
  readonly date: string;
}

export interface CategoryDrilldownData {
  readonly trend: ChartSeries;
  readonly transactions: CategoryDrilldownTransaction[];
}

export interface CategoryBreakdownFilters {
  readonly metric: 'expenses' | 'income';
  readonly period: Period;
  readonly granularity: Granularity;
}
