import { describe, it, expect } from 'vitest';
import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import { overlapsExisting } from '#features/csv-import/model/anonymization/conflict-resolver/overlaps-existing';

const makeSpan = (start: number, end: number): DetectionSpan => ({
  start,
  end,
  type: 'name',
  confidence: 0.9,
  original: 'test',
  detectorId: 'test',
});

describe('overlapsExisting', () => {
  it('returns true when span overlaps an existing span', () => {
    const existing = [makeSpan(5, 10)];
    expect(overlapsExisting(makeSpan(8, 15), existing)).toBe(true);
  });

  it('returns false when span does not overlap any existing span', () => {
    const existing = [makeSpan(5, 10)];
    expect(overlapsExisting(makeSpan(10, 15), existing)).toBe(false);
  });

  it('returns false when resolved list is empty', () => {
    expect(overlapsExisting(makeSpan(0, 5), [])).toBe(false);
  });

  it('returns true when span is fully contained within existing', () => {
    const existing = [makeSpan(0, 20)];
    expect(overlapsExisting(makeSpan(5, 10), existing)).toBe(true);
  });

  it('returns true when span fully contains existing', () => {
    const existing = [makeSpan(5, 10)];
    expect(overlapsExisting(makeSpan(0, 20), existing)).toBe(true);
  });
});
