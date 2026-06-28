import { describe, expect, it } from 'vitest';

import { getSeriesColors } from './getSeriesColors';

describe('getSeriesColors', () => {
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
