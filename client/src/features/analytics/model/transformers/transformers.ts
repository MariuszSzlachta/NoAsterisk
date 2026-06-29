import type { CategoryBreakdownItem } from '#features/analytics/model/types';
import type { ChartDataPoint } from '#shared/adapters/charts';

export const mapBreakdownToChartData = (
  items: CategoryBreakdownItem[],
): ChartDataPoint[] =>
  items.map((item) => ({ label: item.category, value: item.amount }));
