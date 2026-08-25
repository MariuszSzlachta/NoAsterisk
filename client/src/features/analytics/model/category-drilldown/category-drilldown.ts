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

// ─── Helpers ─────────────────────────────────────────────────────

const matchesCategory = (tx: StoredTransaction, categoryLabel: string): boolean =>
  getCategoryLabel(tx.categoryId) === categoryLabel;

const buildMonthlyTrend = (
  transactions: readonly StoredTransaction[],
  category: string,
): ChartSeries => {
  // REVIEW [P1]: Funkcja czyta new Date() z systemu, więc wynik pure modelu
  // zmienia się w czasie i testy nie są deterministyczne. now/Clock oraz zakres
  // powinny być zależnościami wejściowymi, nie ukrytą globalną implementacją.
  const now = new Date();
  const data: ChartSeriesDataPoint[] = [];

  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const monthStart = month.toISOString().slice(0, 10);
    const monthEndStr = monthEnd.toISOString().slice(0, 10);

    // REVIEW [P0]: Trend ignoruje dateRange i metric z wywołania poniżej:
    // zawsze liczy ostatnie 6 miesięcy i sumuje absolute amounts, więc drilldown
    // income zawiera też wydatki, a wybór 1m/1y nie ma wpływu na wykres. Przekaż
    // znormalizowany zakres i metrykę do buildera oraz pokryj oba przypadki testami.
    const monthTotal = transactions
      .filter(
        (tx) =>
          tx.date >= monthStart &&
          tx.date <= monthEndStr &&
          matchesCategory(tx, category),
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
 * - 6-month trend chart series
 * - Most recent transactions (max 10)
 */
export const computeCategoryDrilldown = (
  transactions: readonly StoredTransaction[],
  category: string,
  dateRange: { from: string; to: string },
  metric: CategoryBreakdownFilters['metric'],
): CategoryDrilldownData => {
  const categoryTransactions = transactions.filter(
    (tx) =>
      tx.date >= dateRange.from &&
      tx.date <= dateRange.to &&
      matchesCategory(tx, category) &&
      (metric === 'expenses' ? tx.amount < 0 : tx.amount > 0),
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

  return { trend, transactions: recentTransactions };
};
