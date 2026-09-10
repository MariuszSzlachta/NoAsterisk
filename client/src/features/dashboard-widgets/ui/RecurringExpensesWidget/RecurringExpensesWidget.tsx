import type { ReactNode } from 'react';

import { DASHBOARD_WIDGET_HEADER_RESPONSIVE_CLASS } from '#features/dashboard-widgets/ui/constants';
import type { RecurringExpensesWidgetVM } from '#features/dashboard-widgets/ui/hooks/useRecurringExpensesWidget';
import { Card, CardHeader } from '#shared/ui/Card';

interface RecurringExpensesWidgetProps {
  readonly data: RecurringExpensesWidgetVM;
  readonly title: string;
  readonly subtitle?: string;
  readonly action?: ReactNode;
}

export const RecurringExpensesWidget = ({
  data,
  title,
  subtitle,
  action,
}: RecurringExpensesWidgetProps): React.JSX.Element => (
  <Card
    className={`overflow-hidden pb-3 lg:pb-5 ${DASHBOARD_WIDGET_HEADER_RESPONSIVE_CLASS}`}
  >
    <CardHeader title={title} subtitle={subtitle} action={action} />
    <ul className="flex-1 divide-y divide-border overflow-y-auto">
      {data.items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between px-2 py-2.5 lg:px-4"
        >
          <div className="flex flex-col">
            <span className="text-sm text-foreground">{item.name}</span>
            <span className="text-xs text-muted-foreground">{item.cycle}</span>
          </div>
          <span className="font-mono text-sm tabular-nums text-foreground">
            {item.amount}
          </span>
        </li>
      ))}
    </ul>
    <div className="mt-auto flex items-center justify-between border-t border-border px-2 py-3 lg:px-4">
      <span className="text-sm font-medium text-muted-foreground">
        Razem / mies.
      </span>
      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
        {data.total}
      </span>
    </div>
  </Card>
);
