import type { Bucket } from '#features/analytics/model/buckets';
import type { MetricType } from '#features/analytics/model/types';
import type { StoredTransaction } from '#entities/transaction/types';

// ─── Metric for a Single Bucket ──────────────────────────────────

/** Computes the value of a given metric for transactions within one bucket. */
export const computeMetricForBucket = (
  transactions: readonly StoredTransaction[],
  bucket: Bucket,
  metric: MetricType,
  allTransactions: readonly StoredTransaction[],
): number => {
  const inBucket = transactions.filter(
    (tx) => tx.date >= bucket.start && tx.date <= bucket.end,
  );

  switch (metric) {
    case 'income':
      return inBucket.filter((tx) => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
    case 'expenses':
      return Math.abs(
        inBucket.filter((tx) => tx.amount < 0).reduce((s, tx) => s + tx.amount, 0),
      );
    case 'savings': {
      const inc = inBucket.filter((tx) => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
      const exp = Math.abs(
        inBucket.filter((tx) => tx.amount < 0).reduce((s, tx) => s + tx.amount, 0),
      );
      return inc - exp;
    }
    case 'balance':
      return allTransactions
        .filter((tx) => tx.date <= bucket.end)
        .reduce((s, tx) => s + tx.amount, 0);
  }
};

// ─── Metric for an Entire Period ─────────────────────────────────

/** Computes aggregate value of a metric for the given period of transactions. */
export const computeMetricForPeriod = (
  transactions: readonly StoredTransaction[],
  allTransactions: readonly StoredTransaction[],
  rangeEnd: string,
  metric: MetricType,
): number => {
  switch (metric) {
    case 'income':
      return transactions.filter((tx) => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
    case 'expenses':
      return Math.abs(
        transactions.filter((tx) => tx.amount < 0).reduce((s, tx) => s + tx.amount, 0),
      );
    case 'savings': {
      const inc = transactions.filter((tx) => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
      const exp = Math.abs(
        transactions.filter((tx) => tx.amount < 0).reduce((s, tx) => s + tx.amount, 0),
      );
      return inc - exp;
    }
    case 'balance':
      return allTransactions.filter((tx) => tx.date <= rangeEnd).reduce((s, tx) => s + tx.amount, 0);
  }
};
