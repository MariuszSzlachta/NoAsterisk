import { mapKpiDtoToVm } from '#features/dashboard-widgets/application/mappers/kpi.mapper';
import { useKpiQuery } from '#features/dashboard-widgets/infrastructure/api/useKpiQuery';
import type { KpiItemVM } from '#features/dashboard-widgets/ui/view-models/dashboard.vm';
import type { QueryState } from '#shared/api';

export const useKpiWidget = (): QueryState<KpiItemVM[]> => {
  const { data, isLoading } = useKpiQuery();
  if (isLoading) return { status: 'loading' };
  return { status: 'loaded', data: data.map(mapKpiDtoToVm) };
};
