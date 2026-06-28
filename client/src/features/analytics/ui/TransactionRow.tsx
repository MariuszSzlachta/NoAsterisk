import type { CategoryDrilldownTransaction } from '#features/analytics/model/types';

interface TransactionRowProps {
  readonly transaction: CategoryDrilldownTransaction;
  readonly isExpense: boolean;
  readonly color: string;
}

export const TransactionRow = ({
  transaction,
  isExpense,
  color,
}: TransactionRowProps): React.JSX.Element => (
  <li className="flex items-center justify-between py-2">
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="flex flex-col">
        <span className="text-sm text-foreground">{transaction.title}</span>
        <span className="text-xs text-muted-foreground">{transaction.date}</span>
      </div>
    </div>
    <span
      className={`font-mono text-sm tabular-nums ${isExpense ? 'text-expense' : 'text-income'}`}
    >
      {isExpense ? '−' : '+'}
      {transaction.amount.toLocaleString('pl-PL')} zł
    </span>
  </li>
);
