import { useCategoriesStore } from '#entities/category';
import { useTransactionsStore } from '#entities/transaction';
import type { ChartDataPoint } from '#shared/adapters/charts';
import type { QueryState } from '#shared/api';

import {
  createCategoryLabelMap,
  getDashboardCategoryLabel,
} from '#features/dashboard-widgets/model/category-label';

// ARCH-EXCEPTION: cross-feature import — read-only access to useTransactionsStore public API.
// Planned resolution: migrate to TanStack Query when backend provides aggregation endpoints.

export const useCategoryBreakdownQuery = (): QueryState<ChartDataPoint[]> => {
  const transactions = useTransactionsStore((s) => s.transactions);
  const categories = useCategoriesStore((s) => s.categories);

  const categoryLabels = createCategoryLabelMap(categories);

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
    const label = getDashboardCategoryLabel(tx.categoryId, categoryLabels);
    const current = categoryMap.get(label) ?? 0;
    categoryMap.set(label, current + Math.abs(tx.amount));
  }

  const data: ChartDataPoint[] = [...categoryMap.entries()].map(
    ([label, value]) => ({ label, value }),
  );

  return { status: 'loaded', data };
};
