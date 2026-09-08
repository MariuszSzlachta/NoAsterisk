import type { MetricType } from '#features/analytics/model/types';

const VALID_METRICS: readonly MetricType[] = [
  'balance',
  'income',
  'expenses',
  'savings',
];
const DEFAULT_METRICS: readonly MetricType[] = ['expenses'];

/**
 * Parses the `metric` URL search param into validated MetricType[].
 * Supports comma-separated values (e.g. "income,expenses").
 * Returns a fresh copy of DEFAULT_METRICS when param is null, empty, or contains only invalid values.
 */
export const parseMetricsParam = (param: string | null): MetricType[] => {
  if (!param) {
    return [...DEFAULT_METRICS];
  }

  const parsed = param
    .split(',')
    .filter((value): value is MetricType =>
      VALID_METRICS.some((metric) => metric === value),
    );

  return parsed.length > 0 ? parsed : [...DEFAULT_METRICS];
};
