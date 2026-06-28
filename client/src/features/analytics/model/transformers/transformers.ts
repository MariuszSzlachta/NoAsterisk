import type { ChartDataPoint } from '#shared/adapters/charts';

import type { CategoryBreakdownItem } from '#features/analytics/model/types';

export const mapBreakdownToChartData = (items: CategoryBreakdownItem[]): ChartDataPoint[] =>
  items.map((item) => ({ label: item.category, value: item.amount }));
