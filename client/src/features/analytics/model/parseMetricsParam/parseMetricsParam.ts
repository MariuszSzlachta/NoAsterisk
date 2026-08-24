import type { MetricType } from '#features/analytics/model/types';

const VALID_METRICS: MetricType[] = [
  'balance',
  'income',
  'expenses',
  'savings',
];
const DEFAULT_METRICS: MetricType[] = ['expenses'];
/**
 * Parses the `metric` URL search param into validated MetricType[].
 * Supports comma-separated values (e.g. "income,expenses").
 * Returns DEFAULT_METRICS when param is null, empty, or contains only invalid values.
 */
export const parseMetricsParam = (param: string | null): MetricType[] => {
  if (!param) {
    return DEFAULT_METRICS;
  }

  const parsed = param
    .split(',')
    .filter((m): m is MetricType => VALID_METRICS.includes(m as MetricType));

  return parsed.length > 0 ? parsed : DEFAULT_METRICS;
};
