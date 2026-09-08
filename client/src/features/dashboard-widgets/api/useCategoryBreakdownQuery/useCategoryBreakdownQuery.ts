import { useTransactionsStore } from '#entities/transaction';
import type { ChartDataPoint } from '#shared/adapters/charts';
import type { QueryState } from '#shared/api';

// ARCH-EXCEPTION: cross-feature import — read-only access to useTransactionsStore public API.
// Planned resolution: migrate to TanStack Query when backend provides aggregation endpoints.

export const useCategoryBreakdownQuery = (): QueryState<ChartDataPoint[]> => {
  const transactions = useTransactionsStore((s) => s.transactions);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const expenses = transactions.filter(
    (tx) => tx.date >= monthStart && tx.date <= monthEnd && tx.amount < 0,
  );

  const categoryMap = new Map<string, number>();
  for (const tx of expenses) {
    const label = tx.categoryId ?? 'Bez kategorii';
    const current = categoryMap.get(label) ?? 0;
    categoryMap.set(label, current + Math.abs(tx.amount));
  }

  const data: ChartDataPoint[] = [...categoryMap.entries()].map(
    ([label, value]) => ({ label, value }),
  );

  return { status: 'loaded', data };
};
