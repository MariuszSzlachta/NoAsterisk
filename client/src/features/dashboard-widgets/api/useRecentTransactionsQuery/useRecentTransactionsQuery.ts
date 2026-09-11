import {
  createCategoryLabelMap,
  getDashboardCategoryLabel,
} from '#features/dashboard-widgets/model/category-label';
import { formatAmount } from '#features/dashboard-widgets/model/transformers';
import type { RecentTransactionDto } from '#features/dashboard-widgets/model/types';
import { useCategoriesStore } from '#entities/category';
import { useTransactionsStore } from '#entities/transaction';
import type { QueryState } from '#shared/api';

export type { RecentTransactionDto };

// ARCH-EXCEPTION: cross-feature import — read-only access to useTransactionsStore public API.
// Planned resolution: migrate to TanStack Query when backend provides aggregation endpoints.

const RECENT_LIMIT = 5;

export const useRecentTransactionsQuery = (): QueryState<
  RecentTransactionDto[]
> => {
  const transactions = useTransactionsStore((s) => s.transactions);
  const categories = useCategoriesStore((s) => s.categories);
  const categoryLabels = createCategoryLabelMap(categories);

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  const data: RecentTransactionDto[] = sorted
    .slice(0, RECENT_LIMIT)
    .map((tx) => {
      const lines = tx.description.split('\n');
      const merchant = lines[0] ?? tx.description;
      const direction: 'income' | 'expense' =
        tx.amount >= 0 ? 'income' : 'expense';
      const dateFormatted = new Date(tx.date).toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'short',
      });

      return {
        id: tx.id,
        merchant,
        category: getDashboardCategoryLabel(tx.categoryId, categoryLabels),
        date: dateFormatted,
        amount: formatAmount(tx.amount),
        direction,
      };
    });

  return { status: 'loaded', data };
};
