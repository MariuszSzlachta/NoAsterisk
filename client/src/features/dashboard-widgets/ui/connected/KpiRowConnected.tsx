import { Skeleton } from '#shared/ui/Skeleton';

import { useKpiWidget } from '#features/dashboard-widgets/application/hooks/useKpiWidget';
import { KpiRowWidget } from '#features/dashboard-widgets/ui/KpiRowWidget';

export const KpiRowConnected = (): React.JSX.Element => {
  const state = useKpiWidget();

  if (state.status === 'loading') return <Skeleton className="h-24 w-full" />;
  if (state.status === 'error') return <p className="text-sm text-expense">{state.error}</p>;
  if (state.status === 'notLoaded') return <Skeleton className="h-24 w-full" />;

  return <KpiRowWidget items={state.data} />;
};
