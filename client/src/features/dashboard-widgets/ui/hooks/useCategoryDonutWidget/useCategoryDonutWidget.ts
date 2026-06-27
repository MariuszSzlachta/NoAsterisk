import type { ChartDataPoint } from '#shared/adapters/charts';

import { useCategoryBreakdownQuery } from '#features/dashboard-widgets/api/useCategoryBreakdownQuery';
import type { QueryState } from '#shared/api';

export const useCategoryDonutWidget = (): QueryState<ChartDataPoint[]> => {
  const { data, isLoading } = useCategoryBreakdownQuery();
  if (isLoading) return { status: 'loading' };
  return { status: 'loaded', data };
};
