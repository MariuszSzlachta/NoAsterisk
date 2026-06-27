import type { ReactNode } from 'react';

import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

import { Card, CardHeader } from '#shared/ui/Card';

import type { RecentTransactionVM } from '#features/dashboard-widgets/model/types';

type Direction = RecentTransactionVM['direction'];

const DIRECTION_ICON: Record<Direction, React.JSX.Element> = {
  income: <ArrowDownLeft size={14} className="text-income" />,
  expense: <ArrowUpRight size={14} className="text-expense" />,
};

const DIRECTION_AMOUNT_CLASS: Record<Direction, string> = {
  income: 'text-income',
  expense: 'text-expense',
};

interface RecentTransactionsWidgetProps {
  readonly transactions: RecentTransactionVM[];
  readonly title: string;
  readonly action?: ReactNode;
}

export const RecentTransactionsWidget = ({ transactions, title, action }: RecentTransactionsWidgetProps): React.JSX.Element => (
  <Card>
    <CardHeader title={title} action={action} />
    <ul className="flex flex-col divide-y divide-border">
      {transactions.map((tx) => (
        <li key={tx.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2">
            {DIRECTION_ICON[tx.direction]}
          </span>
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-medium text-foreground">{tx.merchant}</span>
            <span className="text-xs text-muted-foreground">{tx.category} · {tx.date}</span>
          </div>
          <span className={`font-mono text-sm tabular-nums ${DIRECTION_AMOUNT_CLASS[tx.direction]}`}>
            {tx.amount}
          </span>
        </li>
      ))}
    </ul>
  </Card>
);
