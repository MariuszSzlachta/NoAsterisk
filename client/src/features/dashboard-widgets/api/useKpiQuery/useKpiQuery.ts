import { formatAmount } from '#features/dashboard-widgets/model/transformers';
import type { KpiDto, KpiId } from '#features/dashboard-widgets/model/types';
import { useTransactionsStore } from '#entities/transaction';
import type { QueryState } from '#shared/api';

export type { KpiDto, KpiId };

// ARCH-EXCEPTION: cross-feature import — read-only access to useTransactionsStore public API.
// Dashboard needs transaction data for KPI computation. Planned resolution: migrate to TanStack Query
// with real API when backend provides aggregation endpoints.

// ─── Helpers ─────────────────────────────────────────────────────

const computeDelta = (current: number, previous: number): string | undefined => {
  if (previous === 0) {
    return undefined;
  }
  const percent = ((current - previous) / Math.abs(previous)) * 100;
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
};

const computeTrend = (current: number, previous: number): 'up' | 'down' | 'neutral' => {
  if (current > previous) {
    return 'up';
  }
  if (current < previous) {
    return 'down';
  }
  return 'neutral';
};

// ─── Hook ────────────────────────────────────────────────────────

export const useKpiQuery = (): QueryState<KpiDto[]> => {
  const transactions = useTransactionsStore((s) => s.transactions);

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString()
    .slice(0, 10);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    .toISOString()
    .slice(0, 10);

  const currentMonth = transactions.filter(
    (tx) => tx.date >= currentMonthStart && tx.date <= currentMonthEnd,
  );
  const previousMonth = transactions.filter(
    (tx) => tx.date >= prevMonthStart && tx.date <= prevMonthEnd,
  );

  const income = currentMonth
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expenses = Math.abs(
    currentMonth
      .filter((tx) => tx.amount < 0)
      .reduce((sum, tx) => sum + tx.amount, 0),
  );
  const balance = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const savings = income - expenses;

  const prevIncome = previousMonth
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const prevExpenses = Math.abs(
    previousMonth
      .filter((tx) => tx.amount < 0)
      .reduce((sum, tx) => sum + tx.amount, 0),
  );
  const prevBalance = transactions
    .filter((tx) => tx.date <= prevMonthEnd)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const prevSavings = prevIncome - prevExpenses;

  const data: KpiDto[] = [
    {
      id: 'balance',
      label: 'Saldo',
      value: formatAmount(balance),
      deltaPercent: computeDelta(balance, prevBalance),
      trend: computeTrend(balance, prevBalance),
      tooltip: 'Suma wszystkich środków na kontach. Zmiana procentowa vs poprzedni miesiąc.',
    },
    {
      id: 'income',
      label: 'Przychody',
      value: formatAmount(income),
      deltaPercent: computeDelta(income, prevIncome),
      trend: computeTrend(income, prevIncome),
      tooltip: 'Łączne wpływy w bieżącym miesiącu (wynagrodzenie, przelewy przychodzące).',
    },
    {
      id: 'expenses',
      label: 'Wydatki',
      value: formatAmount(expenses),
      deltaPercent: computeDelta(expenses, prevExpenses),
      trend: computeTrend(expenses, prevExpenses),
      tooltip: 'Suma wydatków w bieżącym miesiącu. Wzrost oznacza większe wydatki niż wcześniej.',
    },
    {
      id: 'savings',
      label: 'Oszczędności',
      value: formatAmount(savings),
      deltaPercent: computeDelta(savings, prevSavings),
      trend: computeTrend(savings, prevSavings),
      tooltip: 'Różnica między przychodami a wydatkami w tym miesiącu.',
    },
  ];

  return { status: 'loaded', data };
};
