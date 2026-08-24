import type { MetricType } from '#features/analytics/model/types';

/**
 * Maps MetricType → CSS variable color.
 * Used to determine chart line/bar colors based on the selected metrics.
 */
const METRIC_COLORS: Record<MetricType, string> = {
  balance: 'var(--primary)',
  income: 'var(--income)',
  expenses: 'var(--expense)',
  savings: 'var(--warning)',
};

/**
 * Legacy: maps Polish series labels to colors.
 * @deprecated Use getMetricColors instead.
 */
const SERIES_COLOR: Record<string, string> = {
  Saldo: 'var(--primary)',
  Przychody: 'var(--income)',
  Wydatki: 'var(--expense)',
  Oszczędności: 'var(--warning)',
};

/** Returns color array for given metric types. */
export const getMetricColors = (metrics: MetricType[]): string[] =>
  metrics.map((metric) => METRIC_COLORS[metric]);

/**
 * Returns color array for given series IDs (legacy Polish labels).
 * @deprecated Use getMetricColors instead.
 */
export const getSeriesColors = (seriesIds: string[]): string[] =>
  seriesIds.map((id) => SERIES_COLOR[id] ?? 'var(--primary)');
