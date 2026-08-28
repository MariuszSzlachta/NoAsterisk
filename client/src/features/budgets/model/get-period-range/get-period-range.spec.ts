import { describe, expect, it } from 'vitest';

import { getPeriodRange } from '#features/budgets/model/get-period-range';

describe('getPeriodRange', () => {
  const now = new Date('2026-06-15T12:00:00.000Z');

  it('returns start and end of month for monthly period', () => {
    const { from, to } = getPeriodRange({ type: 'monthly' }, now);
    expect(from.getDate()).toBe(1);
    expect(from.getMonth()).toBe(5);
    expect(to.getDate()).toBe(30);
    expect(to.getMonth()).toBe(5);
  });

  it('returns start and end of year for yearly period', () => {
    const { from, to } = getPeriodRange({ type: 'yearly' }, now);
    expect(from.getMonth()).toBe(0);
    expect(from.getDate()).toBe(1);
    expect(to.getMonth()).toBe(11);
    expect(to.getDate()).toBe(31);
  });

  it('returns parsed dates for custom period', () => {
    const { from, to } = getPeriodRange(
      { type: 'custom', dateFrom: '2026-03-01', dateTo: '2026-05-31' },
      now,
    );
    expect(from.getFullYear()).toBe(2026);
    expect(from.getMonth()).toBe(2);
    expect(from.getDate()).toBe(1);
    expect(to.getFullYear()).toBe(2026);
    expect(to.getMonth()).toBe(4);
    expect(to.getDate()).toBe(31);
  });
});
