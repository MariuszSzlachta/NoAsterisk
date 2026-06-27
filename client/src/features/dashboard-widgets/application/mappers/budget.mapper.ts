import type { BudgetDto } from '#features/dashboard-widgets/infrastructure/api/useBudgetQuery';
import type { BudgetItemVM } from '#features/dashboard-widgets/ui/view-models/dashboard.vm';

export const mapBudgetDtoToVm = (dto: BudgetDto): BudgetItemVM => ({
  label: dto.label,
  spent: dto.spent,
  limit: dto.limit,
  color: dto.color,
});
