import type { ReactNode } from 'react';

import type {
  BudgetDto,
  BudgetItemVM,
  KpiDto,
  KpiItemVM,
  RecentTransactionDto,
  RecentTransactionVM,
} from '#features/dashboard-widgets/model/types';

export const mapKpiDtoToVm = (dto: KpiDto, icon: ReactNode, iconHref: string | undefined, iconTooltip: string | undefined): KpiItemVM => ({
  label: dto.label,
  value: dto.value,
  icon,
  delta: dto.deltaPercent,
  trend: dto.trend,
  tooltip: dto.tooltip,
  iconHref,
  iconTooltip,
});

export const mapBudgetDtoToVm = (dto: BudgetDto): BudgetItemVM => ({
  label: dto.label,
  spent: dto.spent,
  limit: dto.limit,
  color: dto.color,
});

export const mapRecentTransactionDtoToVm = (dto: RecentTransactionDto): RecentTransactionVM => ({
  id: dto.id,
  merchant: dto.merchant,
  category: dto.category,
  date: dto.date,
  amount: dto.amount,
  direction: dto.direction,
});
