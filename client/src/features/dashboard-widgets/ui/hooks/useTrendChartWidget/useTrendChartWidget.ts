import { useTrendQuery } from '#features/dashboard-widgets/api/useTrendQuery';
import type { ChartSeries } from '#shared/adapters/charts';
import type { QueryState } from '#shared/api';

export const useTrendChartWidget = (): QueryState<ChartSeries[]> => {
  const state = useTrendQuery();
  if (state.status !== 'loaded') {
    return state;
  }
  return { status: 'loaded', data: state.data };
};
