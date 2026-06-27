import { Skeleton } from '#shared/ui/Skeleton';

import { useCategoryDonutWidget } from '#features/dashboard-widgets/application/hooks/useCategoryDonutWidget';
import { CategoryDonutWidget } from '#features/dashboard-widgets/ui/CategoryDonutWidget';

export const CategoryDonutConnected = (): React.JSX.Element => {
  const state = useCategoryDonutWidget();

  if (state.status === 'loading') return <Skeleton className="h-[320px] w-full" />;
  if (state.status === 'error') return <p className="text-sm text-expense">{state.error}</p>;
  if (state.status === 'notLoaded') return <Skeleton className="h-[320px] w-full" />;

  return <CategoryDonutWidget data={state.data} title="Wydatki wg kategorii" subtitle="Bieżący miesiąc" />;
};
