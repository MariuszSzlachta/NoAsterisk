import { mapKpiDtoToVm } from '#features/dashboard-widgets/model/transformers';
import { useKpiQuery } from '#features/dashboard-widgets/api/useKpiQuery';
import { FALLBACK_ICON, KPI_ICONS, KPI_ICON_TOOLTIPS, KPI_REPORT_HREFS } from '#features/dashboard-widgets/ui/constants/kpi-config';
import type { KpiItemVM } from '#features/dashboard-widgets/model/types';
import type { QueryState } from '#shared/api';

export const useKpiWidget = (): QueryState<KpiItemVM[]> => {
  const { data, isLoading } = useKpiQuery();
  if (isLoading) return { status: 'loading' };
  return {
    status: 'loaded',
    data: data.map((dto) => mapKpiDtoToVm(dto, KPI_ICONS[dto.id] ?? FALLBACK_ICON, KPI_REPORT_HREFS[dto.id], KPI_ICON_TOOLTIPS[dto.id])),
  };
};
