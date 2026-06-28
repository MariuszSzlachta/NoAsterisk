import type { ReactNode } from 'react';

import type { ChartDataPoint } from '#shared/adapters/charts';

import type {
  BudgetDto,
  BudgetItemVM,
  KpiDto,
  KpiItemVM,
  RecentTransactionDto,
  RecentTransactionVM,
} from '#features/dashboard-widgets/model/types';

const MAX_VISIBLE_CATEGORIES = 6;

export const groupCategoryTail = (data: ChartDataPoint[]): ChartDataPoint[] => {
  if (data.length <= MAX_VISIBLE_CATEGORIES) return data;

  const sorted = [...data].sort((a, b) => b.value - a.value);
  const visible = sorted.slice(0, MAX_VISIBLE_CATEGORIES);
  const tail = sorted.slice(MAX_VISIBLE_CATEGORIES);
  const tailSum = tail.reduce((sum, d) => sum + d.value, 0);

  return [
    ...visible,
    { label: `Inne (${tail.length} kategorii)`, value: tailSum },
  ];
};

export interface KpiMapConfig {
  readonly icon: ReactNode;
  readonly iconHref?: string;
  readonly iconTooltip?: string;
  readonly invertColor?: boolean;
}

export const mapKpiDtoToVm = (
  dto: KpiDto,
  config: KpiMapConfig,
): KpiItemVM => ({
  label: dto.label,
  value: dto.value,
  icon: config.icon,
  delta: dto.deltaPercent,
  trend: dto.trend,
  invertColor: config.invertColor,
  tooltip: dto.tooltip,
  iconHref: config.iconHref,
  iconTooltip: config.iconTooltip,
});

export const mapBudgetDtoToVm = (dto: BudgetDto): BudgetItemVM => ({
  label: dto.label,
  spent: dto.spent,
  limit: dto.limit,
  color: dto.color,
});

export const mapRecentTransactionDtoToVm = (
  dto: RecentTransactionDto,
): RecentTransactionVM => ({
  id: dto.id,
  merchant: dto.merchant,
  category: dto.category,
  date: dto.date,
  amount: dto.amount,
  direction: dto.direction,
});
