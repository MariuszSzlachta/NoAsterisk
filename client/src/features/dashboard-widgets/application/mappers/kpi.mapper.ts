import { CircleHelp, DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import React from 'react';

import type { KpiDto } from '#features/dashboard-widgets/infrastructure/api/useKpiQuery';
import type { KpiItemVM } from '#features/dashboard-widgets/ui/view-models/dashboard.vm';

const KPI_ICONS: Record<string, ReactNode> = {
  'Saldo': React.createElement(Wallet, { size: 16 }),
  'Przychody': React.createElement(TrendingUp, { size: 16 }),
  'Wydatki': React.createElement(TrendingDown, { size: 16 }),
  'Oszczędności': React.createElement(DollarSign, { size: 16 }),
};

const FALLBACK_ICON: ReactNode = React.createElement(CircleHelp, { size: 16 });

export const mapKpiDtoToVm = (dto: KpiDto): KpiItemVM => ({
  label: dto.label,
  value: dto.value,
  icon: KPI_ICONS[dto.label] ?? FALLBACK_ICON,
  delta: dto.deltaPercent,
  trend: dto.trend,
  tooltip: dto.tooltip,
});
