import { useRecentTransactionsQuery } from '#features/dashboard-widgets/api/useRecentTransactionsQuery';
import { mapRecentTransactionDtoToVm } from '#features/dashboard-widgets/model/transformers';
import type { RecentTransactionVM } from '#features/dashboard-widgets/model/types';
import type { QueryState } from '#shared/api';

export const useRecentTransactionsWidget = (): QueryState<
  RecentTransactionVM[]
> => {
  const state = useRecentTransactionsQuery();
  if (state.status !== 'loaded') {
    return state;
  }
  return { status: 'loaded', data: state.data.map(mapRecentTransactionDtoToVm) };
};
