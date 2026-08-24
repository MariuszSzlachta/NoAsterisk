import { describe, expect, it } from 'vitest';

import type { Bucket } from '#features/analytics/model/buckets';
import type { StoredTransaction } from '#features/transactions';

import { computeMetricForBucket, computeMetricForPeriod } from './metric-computation';

// ─── Test Builders ───────────────────────────────────────────────

const tx = (amount: number, date: string): StoredTransaction =>
  ({ id: `tx-${date}-${amount}`, amount, date, description: 'test', categoryId: undefined }) as StoredTransaction;

const bucket: Bucket = { label: 'Jan', start: '2026-01-01', end: '2026-01-31' };

// ─── computeMetricForBucket ──────────────────────────────────────

describe('computeMetricForBucket', () => {
  const transactions = [
    tx(5000, '2026-01-10'),   // income
    tx(-200, '2026-01-15'),   // expense
    tx(-300, '2026-01-20'),   // expense
    tx(1000, '2026-02-05'),   // outside bucket
  ];

  it('income: sums only positive amounts in bucket', () => {
    expect(computeMetricForBucket(transactions, bucket, 'income', transactions)).toBe(5000);
  });

  it('expenses: absolute value of negative amounts in bucket', () => {
    expect(computeMetricForBucket(transactions, bucket, 'expenses', transactions)).toBe(500);
  });

  it('savings: income minus expenses in bucket', () => {
    expect(computeMetricForBucket(transactions, bucket, 'savings', transactions)).toBe(4500);
  });

  it('balance: sum of ALL transactions up to bucket end', () => {
    // 5000 - 200 - 300 = 4500 (feb tx not included because date > bucket.end)
    expect(computeMetricForBucket(transactions, bucket, 'balance', transactions)).toBe(4500);
  });

  it('returns 0 for empty transaction array', () => {
    expect(computeMetricForBucket([], bucket, 'income', [])).toBe(0);
  });

  it('excludes transactions outside bucket range', () => {
    const outsideTx = [tx(999, '2026-02-15')];
    expect(computeMetricForBucket(outsideTx, bucket, 'income', outsideTx)).toBe(0);
  });
});

// ─── computeMetricForPeriod ──────────────────────────────────────

describe('computeMetricForPeriod', () => {
  const all = [
    tx(8000, '2026-01-01'),
    tx(-1500, '2026-01-15'),
    tx(-500, '2026-01-20'),
    tx(2000, '2026-02-01'),
  ];
  const periodTx = all.slice(0, 3); // Jan only

  it('income: sums positive amounts in period', () => {
    expect(computeMetricForPeriod(periodTx, all, '2026-01-31', 'income')).toBe(8000);
  });

  it('expenses: absolute value of negatives in period', () => {
    expect(computeMetricForPeriod(periodTx, all, '2026-01-31', 'expenses')).toBe(2000);
  });

  it('savings: income - expenses for period', () => {
    expect(computeMetricForPeriod(periodTx, all, '2026-01-31', 'savings')).toBe(6000);
  });

  it('balance: sum of all transactions up to rangeEnd', () => {
    // 8000 - 1500 - 500 = 6000 (Feb tx has date > rangeEnd)
    expect(computeMetricForPeriod(periodTx, all, '2026-01-31', 'balance')).toBe(6000);
  });

  it('returns 0 for empty arrays', () => {
    expect(computeMetricForPeriod([], [], '2026-01-31', 'income')).toBe(0);
  });
});
