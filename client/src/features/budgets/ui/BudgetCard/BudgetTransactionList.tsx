import { useTranslation } from 'react-i18next';

import { formatAmount } from '#shared/lib';

import type { BudgetTransactionVM } from '#features/budgets/model/types';

// ─── Props ───────────────────────────────────────────────────────

interface BudgetTransactionListProps {
  readonly transactions: readonly BudgetTransactionVM[];
  readonly currency: string;
}

// ─── Component ───────────────────────────────────────────────────

export const BudgetTransactionList = ({ transactions, currency }: BudgetTransactionListProps): React.JSX.Element => {
  const { t } = useTranslation();

  if (transactions.length === 0) {
    return (
      <div className="mt-3 border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">
          {t('budgets.transactions.empty')}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      <span className="text-xs font-medium text-muted-foreground">
        {t('budgets.transactions.heading')}
      </span>
      <ul className="mt-2 flex flex-col gap-2">
        {transactions.map((tx) => (
          <li key={tx.id} className="flex items-center justify-between rounded-md bg-surface-2 px-3 py-2">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground">{tx.description}</span>
              <span className="text-xs text-muted-foreground">{tx.date}</span>
            </div>
            <span className={`font-mono text-xs tabular-nums ${tx.amount >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatAmount(tx.amount)} {currency}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
