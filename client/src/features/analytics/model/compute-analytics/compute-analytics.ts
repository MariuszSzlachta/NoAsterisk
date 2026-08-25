/**
 * Backward-compatibility facade.
 * All logic has been split into focused modules. This re-exports the public API
 * so existing consumers continue to work without import changes.
 *
 * New code should import from the specific submodule directly.
 */

export { getBuckets, MONTH_KEYS } from '#features/analytics/model/buckets';
export type { Bucket } from '#features/analytics/model/buckets';
export { getCategoryLabel, CATEGORY_LABELS } from '#features/analytics/model/category-resolution';
export { computeDelta, computeTrend } from '#features/analytics/model/compute-delta';
export { getDateRange, getDateRangeAsDate, toLocalDateStr } from '#features/analytics/model/date-range';
export type { DateRangeDate, DateRangeStr } from '#features/analytics/model/date-range';
export { formatAbsoluteAmount, formatSignedAmount, formatAnalyticsAmount } from '#features/analytics/model/format-amount';
export { computeKpi, METRIC_LABELS, METRIC_LABEL_KEYS } from '#features/analytics/model/kpi-computation';
export { computeMetricForBucket, computeMetricForPeriod } from '#features/analytics/model/metric-computation';

// Legacy: re-export SERIES_LABELS for useAnalyticsQuery backward compat
import type { MetricType } from '#features/analytics/model/types';

export const SERIES_LABELS: Record<MetricType, string> = {
  balance: 'Saldo',
  income: 'Przychody',
  expenses: 'Wydatki',
  savings: 'Oszczędności',
};

// Legacy: MONTH_LABELS_PL for backward compat with useCategoryDrilldownQuery
export const MONTH_LABELS_PL = [
  'Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze',
  'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru',
] as const;
