import { useBudgetQuery } from '#features/dashboard-widgets/api/useBudgetQuery';
import { mapBudgetDtoToVm } from '#features/dashboard-widgets/model/transformers';
import type { BudgetItemVM } from '#features/dashboard-widgets/model/types';
import type { QueryState } from '#shared/api';

export const useBudgetProgressWidget = (): QueryState<BudgetItemVM[]> => {
  const state = useBudgetQuery();
  if (state.status !== 'loaded') {
    return state;
  }
  return { status: 'loaded', data: state.data.map(mapBudgetDtoToVm) };
};
