import { useTransactionsStore } from '#model/transaction';
import type { ChartSeries } from '#shared/adapters/charts';
import type { QueryState } from '#shared/api';

// ARCH-EXCEPTION: cross-feature import — read-only access to useTransactionsStore public API.
// Planned resolution: migrate to TanStack Query when backend provides aggregation endpoints.

const MONTHS_TO_SHOW = 6;

const MONTH_LABELS: Record<number, string> = {
  0: 'Sty',
  1: 'Lut',
  2: 'Mar',
  3: 'Kwi',
  4: 'Maj',
  5: 'Cze',
  6: 'Lip',
  7: 'Sie',
  8: 'Wrz',
  9: 'Paź',
  10: 'Lis',
  11: 'Gru',
};

export const useTrendQuery = (): QueryState<ChartSeries[]> => {
  const transactions = useTransactionsStore((s) => s.transactions);

  const now = new Date();
  const months: Array<{ label: string; start: string; end: string }> = [];

  for (let i = MONTHS_TO_SHOW - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    months.push({
      label: MONTH_LABELS[d.getMonth()] ?? '',
      start: d.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    });
  }

  const incomeSeries = months.map((m) => ({
    x: m.label,
    y: transactions
      .filter((tx) => tx.date >= m.start && tx.date <= m.end && tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0),
  }));

  const expenseSeries = months.map((m) => ({
    x: m.label,
    y: Math.abs(
      transactions
        .filter((tx) => tx.date >= m.start && tx.date <= m.end && tx.amount < 0)
        .reduce((sum, tx) => sum + tx.amount, 0),
    ),
  }));

  const data: ChartSeries[] = [
    { id: 'Przychody', data: incomeSeries },
    { id: 'Wydatki', data: expenseSeries },
  ];

  return { status: 'loaded', data };
};
