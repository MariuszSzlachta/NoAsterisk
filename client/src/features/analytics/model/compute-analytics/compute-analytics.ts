import type { MetricType, Period } from '#features/analytics/model/types';
import type { StoredTransaction } from '#features/transactions';

// ─── Date Helpers ────────────────────────────────────────────────

const toLocalDateStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface DateRangeStr {
  readonly from: string;
  readonly to: string;
}

interface DateRangeDate {
  readonly from: Date;
  readonly to: Date;
}

const computeRange = (period: Period): DateRangeDate => {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case '1m':
      return { from: new Date(to.getFullYear(), to.getMonth(), to.getDate() - 30), to };
    case '3m':
      return { from: new Date(to.getFullYear(), to.getMonth(), to.getDate() - 90), to };
    case '6m':
      return { from: new Date(to.getFullYear(), to.getMonth(), to.getDate() - 180), to };
    case '1y':
      return { from: new Date(to.getFullYear(), to.getMonth(), to.getDate() - 365), to };
    case 'ytd':
      return { from: new Date(now.getFullYear(), 0, 1), to };
  }
};

export const getDateRange = (period: Period): DateRangeStr => {
  const { from, to } = computeRange(period);
  return { from: toLocalDateStr(from), to: toLocalDateStr(to) };
};

export const getDateRangeAsDate = (period: Period): DateRangeDate => computeRange(period);

// ─── Category Resolution ─────────────────────────────────────────

// ARCH-EXCEPTION: hardcoded category labels — placeholder until categories feature provides
// a shared lookup. Same stubs used in useTransactionsPageWiring. Will be replaced by
// a shared categories store.
export const CATEGORY_LABELS: Record<string, string> = {
  'cat-groceries': 'Spożywcze',
  'cat-transport': 'Transport',
  'cat-subscriptions': 'Subskrypcje',
  'cat-housing': 'Mieszkanie',
  'cat-salary': 'Wynagrodzenie',
  'cat-entertainment': 'Rozrywka',
  'cat-health': 'Zdrowie',
  'cat-other': 'Inne',
};

const UNCATEGORIZED_LABEL = 'Bez kategorii';

export const getCategoryLabel = (categoryId: string | undefined): string =>
  categoryId ? (CATEGORY_LABELS[categoryId] ?? categoryId) : UNCATEGORIZED_LABEL;

// ─── Delta & Trend ───────────────────────────────────────────────

export const computeDelta = (current: number, previous: number): string => {
  if (previous === 0) {
    return current === 0 ? '0,0%' : '+∞';
  }
  const percent = ((current - previous) / Math.abs(previous)) * 100;
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(1).replace('.', ',')}%`;
};

export const computeTrend = (current: number, previous: number): 'up' | 'down' | 'neutral' => {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'neutral';
};

// ─── Month Labels ────────────────────────────────────────────────

export const MONTH_LABELS_PL = [
  'Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze',
  'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru',
] as const;

// ─── Bucket Generation ───────────────────────────────────────────

import type { Granularity } from '#features/analytics/model/types';

export interface Bucket {
  readonly label: string;
  readonly start: string;
  readonly end: string;
}

export const getBuckets = (from: Date, to: Date, granularity: Granularity): Bucket[] => {
  const buckets: Bucket[] = [];

  if (granularity === 'monthly') {
    const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
    while (cursor <= to) {
      const start = toLocalDateStr(cursor);
      const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      const end = toLocalDateStr(nextMonth);
      const label = `${MONTH_LABELS_PL[cursor.getMonth()]} ${cursor.getFullYear() % 100}`;
      buckets.push({ label, start, end });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else if (granularity === 'weekly') {
    const cursor = new Date(from);
    while (cursor <= to) {
      const start = toLocalDateStr(cursor);
      const weekEnd = new Date(cursor.getTime() + 6 * 86_400_000);
      const end = weekEnd > to ? toLocalDateStr(to) : toLocalDateStr(weekEnd);
      const label = `${cursor.getDate()}.${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      buckets.push({ label, start, end });
      cursor.setTime(cursor.getTime() + 7 * 86_400_000);
    }
  } else {
    const cursor = new Date(from);
    while (cursor <= to) {
      const dateStr = toLocalDateStr(cursor);
      const label = `${cursor.getDate()}.${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      buckets.push({ label, start: dateStr, end: dateStr });
      cursor.setTime(cursor.getTime() + 86_400_000);
    }
  }

  return buckets;
};

// ─── Metric Computation ──────────────────────────────────────────

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

// ─── KPI Computation ─────────────────────────────────────────────

export const METRIC_LABELS: Record<MetricType, string> = {
  balance: 'Aktualne saldo',
  income: 'Przychód (bieżący)',
  expenses: 'Wydatki (bieżący)',
  savings: 'Oszczędności',
};

export const SERIES_LABELS: Record<MetricType, string> = {
  balance: 'Saldo',
  income: 'Przychody',
  expenses: 'Wydatki',
  savings: 'Oszczędności',
};

export const formatAnalyticsAmount = (amount: number): string => {
  const formatted = Math.abs(amount).toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} zł`;
};

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
      return Math.abs(transactions.filter((tx) => tx.amount < 0).reduce((s, tx) => s + tx.amount, 0));
    case 'savings': {
      const inc = transactions.filter((tx) => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
      const exp = Math.abs(transactions.filter((tx) => tx.amount < 0).reduce((s, tx) => s + tx.amount, 0));
      return inc - exp;
    }
    case 'balance':
      return allTransactions.filter((tx) => tx.date <= rangeEnd).reduce((s, tx) => s + tx.amount, 0);
  }
};
