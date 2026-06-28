import type { ReactNode } from 'react';

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
  <Card>
    <CardHeader title={title} subtitle={subtitle} action={action} />
    <div className="flex flex-1 flex-col overflow-hidden">
      <ul className="flex flex-col divide-y divide-border overflow-y-auto">
        {data.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between px-4 py-2.5">
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
      <div className="mt-auto flex items-center justify-between border-t border-border px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">Razem / mies.</span>
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
          {data.total}
        </span>
      </div>
    </div>
  </Card>
);
