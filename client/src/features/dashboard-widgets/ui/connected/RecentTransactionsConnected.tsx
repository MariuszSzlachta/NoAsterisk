import { Skeleton } from '#shared/ui/Skeleton';

import { useRecentTransactionsWidget } from '#features/dashboard-widgets/application/hooks/useRecentTransactionsWidget';
import { RecentTransactionsWidget } from '#features/dashboard-widgets/ui/RecentTransactionsWidget';

export const RecentTransactionsConnected = (): React.JSX.Element => {
  const state = useRecentTransactionsWidget();

  if (state.status === 'loading') return <Skeleton className="h-[320px] w-full" />;
  if (state.status === 'error') return <p className="text-sm text-expense">{state.error}</p>;
  if (state.status === 'notLoaded') return <Skeleton className="h-[320px] w-full" />;

  return <RecentTransactionsWidget transactions={state.data} title="Ostatnie transakcje" />;
};
