import {
  getCategoryLabel,
  getDateRange,
} from '#features/analytics/model/compute-analytics';
import type {
  CategoryBreakdownFilters,
  CategoryBreakdownItem,
} from '#features/analytics/model/types';
import { useTransactionsStore } from '#features/transactions';
import type { StoredTransaction } from '#features/transactions';
import type { QueryState } from '#shared/api';

// ARCH-EXCEPTION: cross-feature import — read-only access to useTransactionsStore public API.
// Analytics needs transaction data for category breakdown. Planned resolution: migrate to TanStack
// Query with real API when backend provides aggregation endpoints.

export const useCategoryBreakdownQuery = (
  filters: CategoryBreakdownFilters,
): QueryState<CategoryBreakdownItem[]> => {
  const transactions = useTransactionsStore((s) => s.transactions);

  const { from, to } = getDateRange(filters.period);

  const filtered = transactions.filter((tx: StoredTransaction) => {
    if (tx.date < from || tx.date > to) return false;
    if (filters.metric === 'expenses') return tx.amount < 0;
    return tx.amount > 0;
  });

  const grouped = new Map<string, number>();
  for (const tx of filtered) {
    const label = getCategoryLabel(tx.categoryId);
    const current = grouped.get(label) ?? 0;
    grouped.set(label, current + Math.abs(tx.amount));
  }

  const total = Array.from(grouped.values()).reduce((s, v) => s + v, 0);

  const data: CategoryBreakdownItem[] = Array.from(grouped.entries())
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return { status: 'loaded', data };
};
