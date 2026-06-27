import { mapRecentTransactionDtoToVm } from '#features/dashboard-widgets/application/mappers/recent-transactions.mapper';
import { useRecentTransactionsQuery } from '#features/dashboard-widgets/infrastructure/api/useRecentTransactionsQuery';
import type { RecentTransactionVM } from '#features/dashboard-widgets/ui/view-models/dashboard.vm';
import type { QueryState } from '#shared/api';

export const useRecentTransactionsWidget = (): QueryState<RecentTransactionVM[]> => {
  const { data, isLoading } = useRecentTransactionsQuery();
  if (isLoading) return { status: 'loading' };
  return { status: 'loaded', data: data.map(mapRecentTransactionDtoToVm) };
};
