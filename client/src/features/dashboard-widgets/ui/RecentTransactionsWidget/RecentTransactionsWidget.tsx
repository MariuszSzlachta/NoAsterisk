import type { ReactNode } from 'react';

import type { RecentTransactionVM } from '#features/dashboard-widgets/model/types';
import { Card, CardHeader } from '#shared/ui/Card';

type Direction = RecentTransactionVM['direction'];

const DIRECTION_AMOUNT_CLASS: Record<Direction, string> = {
  income: 'text-income',
  expense: 'text-expense',
};

interface RecentTransactionsWidgetProps {
  readonly transactions: RecentTransactionVM[];
  readonly title: string;
  readonly action?: ReactNode;
}

export const RecentTransactionsWidget = ({
  transactions,
  title,
  action,
}: RecentTransactionsWidgetProps): React.JSX.Element => (
  <Card className="overflow-hidden">
    <CardHeader title={title} action={action} />
    {transactions.length === 0 ? (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Brak transakcji
      </p>
    ) : (
      <ul className="flex min-h-0 flex-1 flex-col divide-y divide-border overflow-y-auto">
        {transactions.map((tx) => (
          <li
            key={tx.id}
            className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: tx.categoryColor }}
            />
            <div className="flex flex-1 flex-col">
              <span className="text-sm font-medium text-foreground">
                {tx.merchant}
              </span>
              <span className="text-xs text-muted-foreground">
                {tx.category} · {tx.date}
              </span>
            </div>
            <span
              className={`font-mono text-sm tabular-nums ${DIRECTION_AMOUNT_CLASS[tx.direction]}`}
            >
              {tx.amount}
            </span>
          </li>
        ))}
      </ul>
    )}
  </Card>
);
