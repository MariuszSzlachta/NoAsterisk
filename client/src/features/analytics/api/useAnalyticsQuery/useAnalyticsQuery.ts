import {
  METRIC_LABELS,
  SERIES_LABELS,
  computeDelta,
  computeMetricForBucket,
  computeMetricForPeriod,
  computeTrend,
  formatAnalyticsAmount,
  getBuckets,
  getDateRangeAsDate,
} from '#features/analytics/model/compute-analytics';
import type {
  AnalyticsFilters,
  AnalyticsKpi,
  AnalyticsSeries,
  MetricType,
} from '#features/analytics/model/types';
import { useTransactionsStore } from '#features/transactions';
import type { StoredTransaction } from '#features/transactions';
import type { QueryState } from '#shared/api';

// ARCH-EXCEPTION: cross-feature import — read-only access to useTransactionsStore public API.
// Analytics needs transaction data for chart computation. Planned resolution: migrate to TanStack Query
// with real API when backend provides aggregation endpoints.

interface AnalyticsData {
  readonly series: AnalyticsSeries[];
  readonly kpis: AnalyticsKpi[];
}

// ─── Helpers ─────────────────────────────────────────────────────

const toLocalDateStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const computeKpi = (
  transactions: readonly StoredTransaction[],
  currentRange: { from: Date; to: Date },
  metric: MetricType,
): AnalyticsKpi => {
  const rangeLengthMs = currentRange.to.getTime() - currentRange.from.getTime();
  const prevFrom = new Date(currentRange.from.getTime() - rangeLengthMs);
  const prevTo = new Date(currentRange.from.getTime() - 86_400_000);

  const currentStr = { from: toLocalDateStr(currentRange.from), to: toLocalDateStr(currentRange.to) };
  const prevStr = { from: toLocalDateStr(prevFrom), to: toLocalDateStr(prevTo) };

  const currentTx = transactions.filter(
    (tx) => tx.date >= currentStr.from && tx.date <= currentStr.to,
  );
  const prevTx = transactions.filter(
    (tx) => tx.date >= prevStr.from && tx.date <= prevStr.to,
  );

  const currentValue = computeMetricForPeriod(currentTx, transactions, currentStr.to, metric);
  const prevValue = computeMetricForPeriod(prevTx, transactions, prevStr.to, metric);

  return {
    label: METRIC_LABELS[metric],
    value: formatAnalyticsAmount(currentValue),
    delta: computeDelta(currentValue, prevValue),
    trend: computeTrend(currentValue, prevValue),
    invertColor: metric === 'expenses',
  };
};

// ─── Hook ────────────────────────────────────────────────────────

export const useAnalyticsQuery = (
  filters: AnalyticsFilters,
): QueryState<AnalyticsData> => {
  const transactions = useTransactionsStore((s) => s.transactions);

  const range = getDateRangeAsDate(filters.period);
  const rangeFrom = toLocalDateStr(range.from);
  const rangeTo = toLocalDateStr(range.to);

  const filteredTransactions = transactions.filter(
    (tx) => tx.date >= rangeFrom && tx.date <= rangeTo,
  );

  const buckets = getBuckets(range.from, range.to, filters.granularity);

  const series: AnalyticsSeries[] = filters.metrics.map((metric) => ({
    id: SERIES_LABELS[metric],
    data: buckets.map((bucket) => ({
      x: bucket.label,
      y: computeMetricForBucket(filteredTransactions, bucket, metric, transactions),
    })),
  }));

  const kpis: AnalyticsKpi[] = filters.metrics.map((metric) =>
    computeKpi(transactions, range, metric),
  );

  return { status: 'loaded', data: { series, kpis } };
};
