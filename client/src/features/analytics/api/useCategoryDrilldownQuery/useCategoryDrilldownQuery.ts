import {
  MONTH_LABELS_PL,
  getCategoryLabel,
  getDateRange,
} from '#features/analytics/model/compute-analytics';
import type {
  CategoryBreakdownFilters,
  CategoryDrilldownData,
  CategoryDrilldownTransaction,
} from '#features/analytics/model/types';
import { useTransactionsStore } from '#features/transactions';
import type { StoredTransaction } from '#features/transactions';
import type { ChartSeries, ChartSeriesDataPoint } from '#shared/adapters/charts';
import type { QueryState } from '#shared/api';

// ARCH-EXCEPTION: cross-feature import — read-only access to useTransactionsStore public API.
// Analytics needs transaction data for drilldown. Planned resolution: migrate to TanStack Query
// with real API when backend provides aggregation endpoints.

const MAX_TRANSACTIONS = 10;

// ─── Helpers ─────────────────────────────────────────────────────

const matchesCategory = (tx: StoredTransaction, categoryLabel: string): boolean =>
  getCategoryLabel(tx.categoryId) === categoryLabel;

const buildMonthlyTrend = (
  transactions: readonly StoredTransaction[],
  category: string,
): ChartSeries => {
  const now = new Date();
  const data: ChartSeriesDataPoint[] = [];

  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const monthStart = month.toISOString().slice(0, 10);
    const monthEndStr = monthEnd.toISOString().slice(0, 10);

    const monthTotal = transactions
      .filter(
        (tx) =>
          tx.date >= monthStart &&
          tx.date <= monthEndStr &&
          matchesCategory(tx, category),
      )
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const label = `${MONTH_LABELS_PL[month.getMonth()]} ${month.getFullYear() % 100}`;
    data.push({ x: label, y: Math.round(monthTotal * 100) / 100 });
  }

  return { id: category, data };
};

// ─── Hook ────────────────────────────────────────────────────────

export const useCategoryDrilldownQuery = (
  category: string,
  filters: CategoryBreakdownFilters,
): QueryState<CategoryDrilldownData> => {
  const transactions = useTransactionsStore((s) => s.transactions);

  const { from, to } = getDateRange(filters.period);

  const categoryTransactions = transactions.filter(
    (tx) =>
      tx.date >= from &&
      tx.date <= to &&
      matchesCategory(tx, category) &&
      (filters.metric === 'expenses' ? tx.amount < 0 : tx.amount > 0),
  );

  const trend = buildMonthlyTrend(transactions, category);

  const recentTransactions: CategoryDrilldownTransaction[] = [...categoryTransactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_TRANSACTIONS)
    .map((tx) => ({
      id: tx.id,
      title: tx.description,
      amount: Math.abs(tx.amount),
      date: tx.date,
    }));

  return {
    status: 'loaded',
    data: { trend, transactions: recentTransactions },
  };
};
