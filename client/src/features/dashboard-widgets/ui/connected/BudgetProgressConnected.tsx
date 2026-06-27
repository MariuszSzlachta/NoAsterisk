import { Skeleton } from '#shared/ui/Skeleton';

import { useBudgetProgressWidget } from '#features/dashboard-widgets/application/hooks/useBudgetProgressWidget';
import { BudgetProgressWidget } from '#features/dashboard-widgets/ui/BudgetProgressWidget';

export const BudgetProgressConnected = (): React.JSX.Element => {
  const state = useBudgetProgressWidget();

  if (state.status === 'loading') return <Skeleton className="h-[320px] w-full" />;
  if (state.status === 'error') return <p className="text-sm text-expense">{state.error}</p>;
  if (state.status === 'notLoaded') return <Skeleton className="h-[320px] w-full" />;

  return <BudgetProgressWidget items={state.data} title="Budżety" subtitle="Czerwiec 2025" currency="PLN" />;
};
