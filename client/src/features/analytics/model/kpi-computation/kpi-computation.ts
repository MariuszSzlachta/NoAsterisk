import { computeDelta, computeTrend } from '#features/analytics/model/compute-delta';
import { toLocalDateStr } from '#features/analytics/model/date-range';
import { formatAnalyticsAmount } from '#features/analytics/model/format-amount';
import { computeMetricForPeriod } from '#features/analytics/model/metric-computation';
import type { AnalyticsKpi, MetricType } from '#features/analytics/model/types';
import type { StoredTransaction } from '#features/transactions';

const MS_PER_DAY = 86_400_000;

/** i18n keys for KPI labels — caller resolves via t(). */
export const METRIC_LABEL_KEYS: Record<MetricType, string> = {
  balance: 'analytics.kpi.balance',
  income: 'analytics.kpi.income',
  expenses: 'analytics.kpi.expenses',
  savings: 'analytics.kpi.savings',
};

/**
 * Legacy Polish metric labels.
 * @deprecated Use METRIC_LABEL_KEYS + t() instead.
 */
export const METRIC_LABELS: Record<MetricType, string> = {
  balance: 'Aktualne saldo',
  income: 'Przychód (bieżący)',
  expenses: 'Wydatki (bieżący)',
  savings: 'Oszczędności',
};

// REVIEW [P1]: Model zwraca polskie presentation strings, mimo że obok istnieje
// METRIC_LABEL_KEYS i aplikacja ma i18n. W angielskim locale KPI nadal pokaże
// polski tekst, a UI używa label jako React key. Zwracaj stable metric/key,
// tłumacz dopiero w komponencie i identyfikuj KPI po metric, nie po label.
/**
 * Computes a single KPI for the given metric by comparing current range vs previous range.
 * The previous range is the same duration immediately before the current range.
 */
export const computeKpi = (
  transactions: readonly StoredTransaction[],
  currentRange: { from: Date; to: Date },
  metric: MetricType,
): AnalyticsKpi => {
  const rangeLengthMs = currentRange.to.getTime() - currentRange.from.getTime();
  const prevFrom = new Date(currentRange.from.getTime() - rangeLengthMs);
  const prevTo = new Date(currentRange.from.getTime() - MS_PER_DAY);

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
