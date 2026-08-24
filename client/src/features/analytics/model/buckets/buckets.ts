import { toLocalDateStr } from '#features/analytics/model/date-range';
import type { Granularity } from '#features/analytics/model/types';

const MS_PER_DAY = 86_400_000;

// ─── Month Abbreviations ─────────────────────────────────────────

/** Month abbreviation keys for i18n. Indices 0–11. */
export const MONTH_KEYS = [
  'months.jan', 'months.feb', 'months.mar', 'months.apr',
  'months.may', 'months.jun', 'months.jul', 'months.aug',
  'months.sep', 'months.oct', 'months.nov', 'months.dec',
] as const;

// ─── Bucket Type ─────────────────────────────────────────────────

export interface Bucket {
  readonly label: string;
  readonly start: string;
  readonly end: string;
}

// ─── Bucket Generators ───────────────────────────────────────────

const buildMonthlyBuckets = (from: Date, to: Date): Bucket[] => {
  const buckets: Bucket[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);

  while (cursor <= to) {
    const start = toLocalDateStr(cursor);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const end = toLocalDateStr(monthEnd);
    const label = `${MONTH_KEYS[cursor.getMonth()]}:${cursor.getFullYear() % 100}`;
    buckets.push({ label, start, end });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return buckets;
};

const buildWeeklyBuckets = (from: Date, to: Date): Bucket[] => {
  const buckets: Bucket[] = [];
  const cursor = new Date(from);

  while (cursor <= to) {
    const start = toLocalDateStr(cursor);
    const weekEnd = new Date(cursor.getTime() + 6 * MS_PER_DAY);
    const end = weekEnd > to ? toLocalDateStr(to) : toLocalDateStr(weekEnd);
    const label = `${cursor.getDate()}.${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    buckets.push({ label, start, end });
    cursor.setTime(cursor.getTime() + 7 * MS_PER_DAY);
  }

  return buckets;
};

const buildDailyBuckets = (from: Date, to: Date): Bucket[] => {
  const buckets: Bucket[] = [];
  const cursor = new Date(from);

  while (cursor <= to) {
    const dateStr = toLocalDateStr(cursor);
    const label = `${cursor.getDate()}.${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    buckets.push({ label, start: dateStr, end: dateStr });
    cursor.setTime(cursor.getTime() + MS_PER_DAY);
  }

  return buckets;
};

// ─── Public API ──────────────────────────────────────────────────

const BUCKET_BUILDERS: Record<Granularity, (from: Date, to: Date) => Bucket[]> = {
  monthly: buildMonthlyBuckets,
  weekly: buildWeeklyBuckets,
  daily: buildDailyBuckets,
};

/** Generates time buckets for the given range and granularity. */
export const getBuckets = (from: Date, to: Date, granularity: Granularity): Bucket[] =>
  BUCKET_BUILDERS[granularity](from, to);
