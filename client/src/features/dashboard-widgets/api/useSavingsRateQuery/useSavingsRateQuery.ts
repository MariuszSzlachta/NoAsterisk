import { formatAmount } from '#features/dashboard-widgets/model/transformers';
import { useTransactionsStore } from '#features/transactions';
import type { QueryState } from '#shared/api';

// ARCH-EXCEPTION: cross-feature import — read-only access to useTransactionsStore public API.
// Planned resolution: migrate to TanStack Query when backend provides aggregation endpoints.

export interface SavingsRateDto {
  readonly rate: number;
  readonly savedAmount: string;
  readonly income: string;
}

export const useSavingsRateQuery = (): QueryState<SavingsRateDto> => {
  const transactions = useTransactionsStore((s) => s.transactions);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const currentMonth = transactions.filter(
    (tx) => tx.date >= monthStart && tx.date <= monthEnd,
  );

  const income = currentMonth
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expenses = Math.abs(
    currentMonth
      .filter((tx) => tx.amount < 0)
      .reduce((sum, tx) => sum + tx.amount, 0),
  );
  const saved = income - expenses;
  const rate = income > 0 ? Math.round((saved / income) * 100) : 0;

  return {
    status: 'loaded',
    data: {
      rate: Math.max(rate, 0),
      savedAmount: formatAmount(saved),
      income: formatAmount(income),
    },
  };
};
