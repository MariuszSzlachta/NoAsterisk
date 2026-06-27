import { mapBudgetDtoToVm } from '#features/dashboard-widgets/application/mappers/budget.mapper';
import { useBudgetQuery } from '#features/dashboard-widgets/infrastructure/api/useBudgetQuery';
import type { BudgetItemVM } from '#features/dashboard-widgets/ui/view-models/dashboard.vm';
import type { QueryState } from '#shared/api';

export const useBudgetProgressWidget = (): QueryState<BudgetItemVM[]> => {
  const { data, isLoading } = useBudgetQuery();
  if (isLoading) return { status: 'loading' };
  return { status: 'loaded', data: data.map(mapBudgetDtoToVm) };
};
