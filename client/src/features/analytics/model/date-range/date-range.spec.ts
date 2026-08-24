import { describe, expect, it } from 'vitest';

import { getDateRange, getDateRangeAsDate, toLocalDateStr } from './date-range';

describe('toLocalDateStr', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(toLocalDateStr(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('pads single-digit month and day', () => {
    expect(toLocalDateStr(new Date(2026, 2, 9))).toBe('2026-03-09');
  });

  it('handles end of year', () => {
    expect(toLocalDateStr(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('getDateRange', () => {
  it('returns 30-day range for 1m', () => {
    const { from, to } = getDateRange('1m');
    const diff = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
    expect(diff).toBe(30);
  });

  it('returns 90-day range for 3m', () => {
    const { from, to } = getDateRange('3m');
    const diff = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
    expect(diff).toBe(90);
  });

  it('returns 180-day range for 6m', () => {
    const { from, to } = getDateRange('6m');
    const diff = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
    expect(diff).toBe(180);
  });

  it('returns 365-day range for 1y', () => {
    const { from, to } = getDateRange('1y');
    const diff = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
    expect(diff).toBe(365);
  });

  it('returns Jan 1 as start for ytd', () => {
    const { from } = getDateRange('ytd');
    expect(from).toBe(`${new Date().getFullYear()}-01-01`);
  });

  it('returns ISO date strings', () => {
    const { from, to } = getDateRange('6m');
    expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getDateRangeAsDate', () => {
  it('returns Date objects', () => {
    const { from, to } = getDateRangeAsDate('3m');
    expect(from).toBeInstanceOf(Date);
    expect(to).toBeInstanceOf(Date);
  });

  it('from is before to', () => {
    const { from, to } = getDateRangeAsDate('1m');
    expect(from.getTime()).toBeLessThan(to.getTime());
  });
});
