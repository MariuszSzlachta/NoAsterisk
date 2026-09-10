import { formatCurrency } from '../constants/format-currency';
import { useTransactionStats } from '../hooks/useTransactionStats';

// ─── Component ───────────────────────────────────────────────────

export const TransactionStatusBar = (): React.JSX.Element => {
  const stats = useTransactionStats();

  return (
    <div className="flex h-10 shrink-0 items-center gap-4 border-t border-border bg-surface-2 px-4 text-xs text-muted-foreground">
      <span>{stats.totalCount} transakcji</span>

      {stats.uncategorizedCount > 0 && (
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning" />
          {stats.uncategorizedCount} bez kategorii
        </span>
      )}

      <span className="ml-auto font-mono tabular-nums text-expense">
        Suma wydatków: {formatCurrency(stats.expenseSum, 'PLN')}
      </span>
    </div>
  );
};
