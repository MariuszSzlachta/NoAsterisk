import { mapBudgetDtoToVm } from '#features/dashboard-widgets/model/transformers';
import { useBudgetQuery } from '#features/dashboard-widgets/api/useBudgetQuery';
import type { BudgetItemVM } from '#features/dashboard-widgets/model/types';
import type { QueryState } from '#shared/api';

export const useBudgetProgressWidget = (): QueryState<BudgetItemVM[]> => {
  const { data, isLoading } = useBudgetQuery();
  if (isLoading) return { status: 'loading' };
  return { status: 'loaded', data: data.map(mapBudgetDtoToVm) };
};
