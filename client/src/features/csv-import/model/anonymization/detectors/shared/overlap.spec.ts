import { describe, expect, it } from 'vitest';

import type { DetectionSpan } from '#features/csv-import/model/anonymization/types';

import { overlapsAny } from './overlap';

const span = (start: number, end: number): DetectionSpan => ({
  start,
  end,
  type: 'iban',
  confidence: 0.99,
  original: 'x',
  detectorId: 'test',
});

describe('overlapsAny', () => {
  it('returns false for empty spans', () => {
    expect(overlapsAny([], 0, 10)).toBe(false);
  });

  it('returns true when new range overlaps existing span', () => {
    expect(overlapsAny([span(5, 15)], 10, 20)).toBe(true);
  });

  it('returns true when new range is inside existing span', () => {
    expect(overlapsAny([span(0, 20)], 5, 10)).toBe(true);
  });

  it('returns true when new range contains existing span', () => {
    expect(overlapsAny([span(5, 10)], 0, 20)).toBe(true);
  });

  it('returns false when ranges are adjacent but not overlapping', () => {
    expect(overlapsAny([span(0, 10)], 10, 20)).toBe(false);
  });

  it('returns false when ranges are disjoint', () => {
    expect(overlapsAny([span(0, 5)], 10, 20)).toBe(false);
  });

  it('checks all spans in the array', () => {
    expect(overlapsAny([span(0, 5), span(15, 25)], 20, 30)).toBe(true);
  });
});
