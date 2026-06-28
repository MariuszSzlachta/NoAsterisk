import type { CategoryDrilldownTransaction } from '#features/analytics/model/types';

interface TransactionRowProps {
  readonly transaction: CategoryDrilldownTransaction;
  readonly isExpense: boolean;
}

export const TransactionRow = ({
  transaction,
  isExpense,
}: TransactionRowProps): React.JSX.Element => (
  <li className="flex items-center justify-between py-2">
    <div className="flex flex-col">
      <span className="text-sm text-foreground">{transaction.title}</span>
      <span className="text-xs text-muted-foreground">{transaction.date}</span>
    </div>
    <span
      className={`font-mono text-sm tabular-nums ${isExpense ? 'text-expense' : 'text-income'}`}
    >
      {isExpense ? '−' : '+'}
      {transaction.amount.toLocaleString('pl-PL')} zł
    </span>
  </li>
);
