import type { ChartSeries } from '#shared/adapters/charts';

import { useTrendQuery } from '#features/dashboard-widgets/infrastructure/api/useTrendQuery';
import type { QueryState } from '#shared/api';

export const useTrendChartWidget = (): QueryState<ChartSeries[]> => {
  const { data, isLoading } = useTrendQuery();
  if (isLoading) return { status: 'loading' };
  return { status: 'loaded', data };
};
