import { getCategoryLabel } from '#features/analytics/model/category-resolution';
import type { CategoryBreakdownFilters, CategoryBreakdownItem } from '#features/analytics/model/types';
import type { StoredTransaction } from '#entities/transaction/types';

const UNCATEGORIZED_ID = '__uncategorized__';

/**
 * Computes category breakdown from raw transactions.
 * Groups transactions by categoryId, calculates amounts and percentages.
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
    const id = tx.categoryId ?? UNCATEGORIZED_ID;
    const current = grouped.get(id) ?? 0;
    grouped.set(id, current + Math.abs(tx.amount));
  }

  const total = Array.from(grouped.values()).reduce((s, v) => s + v, 0);

  return Array.from(grouped.entries())
    .map(([categoryId, amount]) => ({
      categoryId,
      category: getCategoryLabel(categoryId === UNCATEGORIZED_ID ? undefined : categoryId),
      amount: Math.round(amount * 100) / 100,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
};
