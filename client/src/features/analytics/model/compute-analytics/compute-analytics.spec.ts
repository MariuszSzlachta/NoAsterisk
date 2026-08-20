import { describe, expect, it } from 'vitest';

import {
  computeDelta,
  computeTrend,
  getCategoryLabel,
  getDateRange,
} from './compute-analytics';

describe('getDateRange', () => {
  it('returns 30-day range for 1m period', () => {
    const { from, to } = getDateRange('1m');
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffDays = Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000);
    expect(diffDays).toBe(30);
  });

  it('returns 90-day range for 3m period', () => {
    const { from, to } = getDateRange('3m');
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffDays = Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000);
    expect(diffDays).toBe(90);
  });

  it('returns ytd range starting Jan 1', () => {
    const { from } = getDateRange('ytd');
    const year = new Date().getFullYear();
    expect(from).toBe(`${year}-01-01`);
  });

  it('returns ISO date strings', () => {
    const { from, to } = getDateRange('6m');
    expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getCategoryLabel', () => {
  it('returns label for known category', () => {
    expect(getCategoryLabel('cat-groceries')).toBe('Spożywcze');
  });

  it('returns categoryId for unknown category', () => {
    expect(getCategoryLabel('cat-unknown')).toBe('cat-unknown');
  });

  it('returns "Bez kategorii" for undefined', () => {
    expect(getCategoryLabel(undefined)).toBe('Bez kategorii');
  });
});

describe('computeDelta', () => {
  it('computes positive delta', () => {
    expect(computeDelta(125, 100)).toBe('+25,0%');
  });

  it('computes negative delta', () => {
    expect(computeDelta(80, 100)).toBe('-20,0%');
  });

  it('returns "0,0%" when both values are zero', () => {
    expect(computeDelta(0, 0)).toBe('0,0%');
  });

  it('returns "+∞" when previous is zero but current is not', () => {
    expect(computeDelta(100, 0)).toBe('+∞');
  });

  it('handles negative previous values', () => {
    expect(computeDelta(-50, -100)).toBe('+50,0%');
  });
});

describe('computeTrend', () => {
  it('returns "up" when current > previous', () => {
    expect(computeTrend(100, 80)).toBe('up');
  });

  it('returns "down" when current < previous', () => {
    expect(computeTrend(80, 100)).toBe('down');
  });

  it('returns "neutral" when equal', () => {
    expect(computeTrend(100, 100)).toBe('neutral');
  });
});
