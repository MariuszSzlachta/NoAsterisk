import { useCategoryBreakdownQuery } from '#features/dashboard-widgets/api/useCategoryBreakdownQuery';
import { groupCategoryTail } from '#features/dashboard-widgets/model/transformers';
import type { ChartDataPoint } from '#shared/adapters/charts';
import type { QueryState } from '#shared/api';

export const useCategoryDonutWidget = (): QueryState<ChartDataPoint[]> => {
  const { data, isLoading } = useCategoryBreakdownQuery();
  if (isLoading) {
    return { status: 'loading' };
  }
  return { status: 'loaded', data: groupCategoryTail(data) };
};
