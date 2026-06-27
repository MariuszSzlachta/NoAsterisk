import { Skeleton } from '#shared/ui/Skeleton';

import { useTrendChartWidget } from '#features/dashboard-widgets/application/hooks/useTrendChartWidget';
import { TrendChartWidget } from '#features/dashboard-widgets/ui/TrendChartWidget';

export const TrendChartConnected = (): React.JSX.Element => {
  const state = useTrendChartWidget();

  if (state.status === 'loading') return <Skeleton className="h-[320px] w-full" />;
  if (state.status === 'error') return <p className="text-sm text-expense">{state.error}</p>;
  if (state.status === 'notLoaded') return <Skeleton className="h-[320px] w-full" />;

  return <TrendChartWidget data={state.data} title="Przychody vs Wydatki" subtitle="Ostatnie 6 miesięcy" />;
};
