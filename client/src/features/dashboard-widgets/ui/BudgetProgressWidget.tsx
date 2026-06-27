import { BudgetProgressList } from '#shared/ui/BudgetProgressList';
import { Card, CardHeader } from '#shared/ui/Card';

import type { BudgetItemVM } from '#features/dashboard-widgets/ui/view-models/dashboard.vm';

interface BudgetProgressWidgetProps {
  readonly items: BudgetItemVM[];
  readonly title: string;
  readonly subtitle?: string;
  readonly currency: string;
}

export const BudgetProgressWidget = ({ items, title, subtitle, currency }: BudgetProgressWidgetProps): React.JSX.Element => (
  <Card>
    <CardHeader title={title} subtitle={subtitle} />
    <BudgetProgressList items={items} currency={currency} />
  </Card>
);
