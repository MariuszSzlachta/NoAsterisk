import { mapRecentTransactionDtoToVm } from '#features/dashboard-widgets/model/transformers';
import { useRecentTransactionsQuery } from '#features/dashboard-widgets/api/useRecentTransactionsQuery';
import type { RecentTransactionVM } from '#features/dashboard-widgets/model/types';
import type { QueryState } from '#shared/api';

export const useRecentTransactionsWidget = (): QueryState<RecentTransactionVM[]> => {
  const { data, isLoading } = useRecentTransactionsQuery();
  if (isLoading) return { status: 'loading' };
  return { status: 'loaded', data: data.map(mapRecentTransactionDtoToVm) };
};
