import { describe, expect, it } from 'vitest';

import { getMetricColors, getSeriesColors } from './getSeriesColors';

describe('getSeriesColors (legacy)', () => {
  it('maps known series ids to their colors', () => {
    expect(getSeriesColors(['Przychody', 'Wydatki'])).toEqual([
      'var(--income)',
      'var(--expense)',
    ]);
  });

  it('falls back to primary for unknown ids', () => {
    expect(getSeriesColors(['Unknown'])).toEqual(['var(--primary)']);
  });
});

describe('getMetricColors', () => {
  it('maps MetricType to their colors', () => {
    expect(getMetricColors(['income', 'expenses'])).toEqual([
      'var(--income)',
      'var(--expense)',
    ]);
  });

  it('maps balance to primary', () => {
    expect(getMetricColors(['balance'])).toEqual(['var(--primary)']);
  });

  it('maps savings to warning', () => {
    expect(getMetricColors(['savings'])).toEqual(['var(--warning)']);
  });
});
