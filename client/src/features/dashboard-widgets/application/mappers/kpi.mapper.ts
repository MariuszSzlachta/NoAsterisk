import { CircleHelp, DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import React from 'react';

import type { KpiDto, KpiId } from '#features/dashboard-widgets/infrastructure/api/useKpiQuery';
import type { KpiItemVM } from '#features/dashboard-widgets/ui/view-models/dashboard.vm';

const KPI_ICONS: Record<KpiId, ReactNode> = {
  balance: React.createElement(Wallet, { size: 16 }),
  income: React.createElement(TrendingUp, { size: 16 }),
  expenses: React.createElement(TrendingDown, { size: 16 }),
  savings: React.createElement(DollarSign, { size: 16 }),
};

const KPI_REPORT_HREFS: Record<KpiId, string> = {
  balance: '/reports/balance',
  income: '/reports/income',
  expenses: '/reports/expenses',
  savings: '/reports/savings',
};

const FALLBACK_ICON: ReactNode = React.createElement(CircleHelp, { size: 16 });

export const mapKpiDtoToVm = (dto: KpiDto): KpiItemVM => ({
  label: dto.label,
  value: dto.value,
  icon: KPI_ICONS[dto.id] ?? FALLBACK_ICON,
  delta: dto.deltaPercent,
  trend: dto.trend,
  tooltip: dto.tooltip,
  iconHref: KPI_REPORT_HREFS[dto.id],
});
