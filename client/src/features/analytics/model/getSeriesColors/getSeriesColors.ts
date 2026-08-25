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

const isMetricType = (value: string): value is MetricType =>
  value in METRIC_COLORS;

/** Returns color array for given metric types. */
export const getMetricColors = (metrics: MetricType[]): string[] =>
  metrics.map((metric) => METRIC_COLORS[metric]);

/**
 * Returns color array for given series IDs.
 * Series IDs should be MetricType values (e.g. 'balance', 'income').
 */
export const getSeriesColors = (seriesIds: string[]): string[] =>
  seriesIds.map((id) => isMetricType(id) ? METRIC_COLORS[id] : 'var(--primary)');
