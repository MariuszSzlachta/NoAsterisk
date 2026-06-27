import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

import { Card, CardHeader } from '#shared/ui/Card';

type TransactionDirection = 'income' | 'expense';

interface RecentTransaction {
  readonly id: string;
  readonly merchant: string;
  readonly category: string;
  readonly date: string;
  readonly amount: string;
  readonly direction: TransactionDirection;
}

const useRecentTransactions = (): RecentTransaction[] => [
  { id: '1', merchant: 'BIEDRONKA', category: 'Zakupy', date: '27 cze', amount: '−87,43 zł', direction: 'expense' },
  { id: '2', merchant: 'SPOTIFY', category: 'Subskrypcje', date: '26 cze', amount: '−29,99 zł', direction: 'expense' },
  { id: '3', merchant: 'Przelew przychodzący', category: 'Wynagrodzenie', date: '25 cze', amount: '+8 500,00 zł', direction: 'income' },
  { id: '4', merchant: 'UBER', category: 'Transport', date: '24 cze', amount: '−34,50 zł', direction: 'expense' },
  { id: '5', merchant: 'ALLEGRO', category: 'Zakupy', date: '23 cze', amount: '−249,00 zł', direction: 'expense' },
];

const DIRECTION_ICON: Record<TransactionDirection, React.JSX.Element> = {
  income: <ArrowDownLeft size={14} className="text-income" />,
  expense: <ArrowUpRight size={14} className="text-expense" />,
};

const DIRECTION_AMOUNT_CLASS: Record<TransactionDirection, string> = {
  income: 'text-income',
  expense: 'text-expense',
};

export const RecentTransactionsWidget = (): React.JSX.Element => {
  const transactions = useRecentTransactions();

  return (
    <Card>
      <CardHeader title="Ostatnie transakcje" />
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
};
