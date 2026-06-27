import type { ReactNode } from 'react';

import type { BudgetItemVM } from '#features/dashboard-widgets/model/types';
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
  <Card>
    <CardHeader title={title} subtitle={subtitle} action={action} />
    <BudgetProgressList items={items} currency={currency} />
  </Card>
);
