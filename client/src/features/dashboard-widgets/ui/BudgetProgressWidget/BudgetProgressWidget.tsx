import type { ReactNode } from 'react';

import type { BudgetItemVM } from '#features/dashboard-widgets/model/types';
import { DASHBOARD_WIDGET_HEADER_RESPONSIVE_CLASS } from '#features/dashboard-widgets/ui/constants';
import { BudgetProgressList } from '#shared/ui/BudgetProgressList';
import { Card, CardHeader } from '#shared/ui/Card';

interface BudgetProgressWidgetProps {
  readonly items: BudgetItemVM[];
  readonly title: string;
  readonly subtitle?: string;
  readonly currency: string;
  readonly action?: ReactNode;
}

export const BudgetProgressWidget = ({
  items,
  title,
  subtitle,
  currency,
  action,
}: BudgetProgressWidgetProps): React.JSX.Element => (
  <Card className={`overflow-hidden ${DASHBOARD_WIDGET_HEADER_RESPONSIVE_CLASS}`}>
    <CardHeader title={title} subtitle={subtitle} action={action} />
    {items.length === 0 ? (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Brak budżetów
      </p>
    ) : (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <BudgetProgressList items={items} currency={currency} />
      </div>
    )}
  </Card>
);
