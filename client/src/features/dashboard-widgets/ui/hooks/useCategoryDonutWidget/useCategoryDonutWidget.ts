import { useCategoryBreakdownQuery } from '#features/dashboard-widgets/api/useCategoryBreakdownQuery';
import { groupCategoryTail } from '#features/dashboard-widgets/model/transformers';
import type { ChartDataPoint } from '#shared/adapters/charts';
import type { QueryState } from '#shared/api';

export const useCategoryDonutWidget = (): QueryState<ChartDataPoint[]> => {
  const state = useCategoryBreakdownQuery();
  if (state.status !== 'loaded') {
    return state;
  }
  return { status: 'loaded', data: groupCategoryTail(state.data) };
};
