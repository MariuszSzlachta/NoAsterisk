import { getCategoryLabel } from '#features/analytics/model/category-resolution';
import type { CategoryBreakdownFilters, CategoryBreakdownItem } from '#features/analytics/model/types';
import type { StoredTransaction } from '#features/transactions';

/**
 * Computes category breakdown from raw transactions.
 * Groups transactions by category, calculates amounts and percentages.
 * Returns sorted descending by amount.
 */
export const computeCategoryBreakdown = (
  transactions: readonly StoredTransaction[],
  dateRange: { from: string; to: string },
  metric: CategoryBreakdownFilters['metric'],
): CategoryBreakdownItem[] => {
  const filtered = transactions.filter((tx) => {
    if (tx.date < dateRange.from || tx.date > dateRange.to) return false;
    return metric === 'expenses' ? tx.amount < 0 : tx.amount > 0;
  });

  const grouped = new Map<string, number>();
  for (const tx of filtered) {
    const label = getCategoryLabel(tx.categoryId);
    const current = grouped.get(label) ?? 0;
    grouped.set(label, current + Math.abs(tx.amount));
  }

  const total = Array.from(grouped.values()).reduce((s, v) => s + v, 0);

  return Array.from(grouped.entries())
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
};
