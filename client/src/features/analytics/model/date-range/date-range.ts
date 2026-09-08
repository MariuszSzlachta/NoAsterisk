import type { Period } from '#features/analytics/model/types';

// ─── Types ───────────────────────────────────────────────────────

export interface DateRangeStr {
  readonly from: string;
  readonly to: string;
}

export interface DateRangeDate {
  readonly from: Date;
  readonly to: Date;
}

// ─── Helpers ─────────────────────────────────────────────────────

/** Formats a Date to 'YYYY-MM-DD' string using local timezone. */
export const toLocalDateStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ─── Range Computation ───────────────────────────────────────────

const PERIOD_DAYS: Record<Exclude<Period, 'ytd'>, number> = {
  '1m': 30,
  '3m': 90,
  '6m': 180,
  '1y': 365,
};

const computeRange = (period: Period): DateRangeDate => {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === 'ytd') {
    return { from: new Date(now.getFullYear(), 0, 1), to };
  }

  const days = PERIOD_DAYS[period];
  return { from: new Date(to.getFullYear(), to.getMonth(), to.getDate() - days), to };
};

/** Returns date range in ISO date-string format ('YYYY-MM-DD'). */
export const getDateRange = (period: Period): DateRangeStr => {
  const { from, to } = computeRange(period);
  return { from: toLocalDateStr(from), to: toLocalDateStr(to) };
};

/** Returns date range in Date-object format. */
export const getDateRangeAsDate = (period: Period): DateRangeDate => computeRange(period);
