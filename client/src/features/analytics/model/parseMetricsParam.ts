import type { MetricType } from '#features/analytics/model/types';

const VALID_METRICS: MetricType[] = [
  'balance',
  'income',
  'expenses',
  'savings',
];
const DEFAULT_METRICS: MetricType[] = ['expenses'];

export const parseMetricsParam = (param: string | null): MetricType[] => {
  if (!param) {
    return DEFAULT_METRICS;
  }

  const parsed = param
    .split(',')
    .filter((m): m is MetricType => VALID_METRICS.includes(m as MetricType));

  return parsed.length > 0 ? parsed : DEFAULT_METRICS;
};
