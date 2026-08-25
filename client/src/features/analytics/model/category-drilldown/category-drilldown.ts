import { MONTH_KEYS } from '#features/analytics/model/buckets';
import { getCategoryLabel } from '#features/analytics/model/category-resolution';
import type {
  CategoryBreakdownFilters,
  CategoryDrilldownData,
  CategoryDrilldownTransaction,
} from '#features/analytics/model/types';
import type { StoredTransaction } from '#features/transactions';
import type { ChartSeries, ChartSeriesDataPoint } from '#shared/adapters/charts';

/** Maximum transactions to show in drilldown. Prevents list from dominating the panel. */
const MAX_TRANSACTIONS = 10;

/** Number of monthly buckets in the trend chart. */
const TREND_MONTHS = 6;

// ─── Helpers ─────────────────────────────────────────────────────

const matchesCategory = (tx: StoredTransaction, categoryLabel: string): boolean =>
  getCategoryLabel(tx.categoryId) === categoryLabel;

const matchesMetric = (tx: StoredTransaction, metric: CategoryBreakdownFilters['metric']): boolean =>
  metric === 'expenses' ? tx.amount < 0 : tx.amount > 0;

const buildMonthlyTrend = (
  transactions: readonly StoredTransaction[],
  category: string,
  dateRange: { from: string; to: string },
  metric: CategoryBreakdownFilters['metric'],
  now: Date,
): ChartSeries => {
  const data: ChartSeriesDataPoint[] = [];

  for (let i = TREND_MONTHS - 1; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const monthStart = month.toISOString().slice(0, 10);
    const monthEndStr = monthEnd.toISOString().slice(0, 10);

    const monthTotal = transactions
      .filter(
        (tx) =>
          tx.date >= monthStart &&
          tx.date <= monthEndStr &&
          tx.date >= dateRange.from &&
          tx.date <= dateRange.to &&
          matchesCategory(tx, category) &&
          matchesMetric(tx, metric),
      )
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const label = `${MONTH_KEYS[month.getMonth()]}:${month.getFullYear() % 100}`;
    data.push({ x: label, y: Math.round(monthTotal * 100) / 100 });
  }

  return { id: category, data };
};

// ─── Public API ──────────────────────────────────────────────────

/**
 * Computes drilldown data for a specific category:
 * - 6-month trend chart series (respects dateRange and metric)
 * - Most recent transactions (max 10)
 *
 * @param now - Current date for trend calculation (injected for testability).
 */
export const computeCategoryDrilldown = (
  transactions: readonly StoredTransaction[],
  category: string,
  dateRange: { from: string; to: string },
  metric: CategoryBreakdownFilters['metric'],
  now: Date = new Date(),
): CategoryDrilldownData => {
  const categoryTransactions = transactions.filter(
    (tx) =>
      tx.date >= dateRange.from &&
      tx.date <= dateRange.to &&
      matchesCategory(tx, category) &&
      matchesMetric(tx, metric),
  );

  const trend = buildMonthlyTrend(transactions, category, dateRange, metric, now);

  const recentTransactions: CategoryDrilldownTransaction[] = [...categoryTransactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_TRANSACTIONS)
    .map((tx) => ({
      id: tx.id,
      title: tx.description,
      amount: Math.abs(tx.amount),
      date: tx.date,
    }));

  return { trend, transactions: recentTransactions };
};
