import type { RecentTransactionDto } from '#features/dashboard-widgets/infrastructure/api/useRecentTransactionsQuery';
import type { RecentTransactionVM } from '#features/dashboard-widgets/ui/view-models/dashboard.vm';

export const mapRecentTransactionDtoToVm = (dto: RecentTransactionDto): RecentTransactionVM => ({
  id: dto.id,
  merchant: dto.merchant,
  category: dto.category,
  date: dto.date,
  amount: dto.amount,
  direction: dto.direction,
});
