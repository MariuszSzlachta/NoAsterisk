import { getBuckets } from '#features/analytics/model/buckets';
import { getDateRangeAsDate, toLocalDateStr } from '#features/analytics/model/date-range';
import { computeKpi } from '#features/analytics/model/kpi-computation';
import { computeMetricForBucket } from '#features/analytics/model/metric-computation';
import type {
  AnalyticsFilters,
  AnalyticsKpi,
  AnalyticsSeries,
} from '#features/analytics/model/types';
// ARCH-EXCEPTION: cross-feature import — read-only access to useTransactionsStore public API.
// Analytics needs transaction data for chart computation. Planned resolution: migrate to TanStack
// Query with real API when backend provides aggregation endpoints.
import { useTransactionsStore } from '#model/transaction';
import type { QueryState } from '#shared/api';

interface AnalyticsData {
  readonly series: AnalyticsSeries[];
  readonly kpis: AnalyticsKpi[];
}

/**
 * Provides analytics data (chart series + KPIs) computed from local transactions.
 * All computation is delegated to model/ pure functions.
 */
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
    id: metric,
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
