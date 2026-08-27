import { describe, expect, it } from 'vitest';

import type { DetectionSpan } from '#features/csv-import/model/anonymization/types';
import { determineStatus } from './determine-status';

const span = (confidence: number): DetectionSpan => ({
  start: 0,
  end: 5,
  type: 'name',
  confidence,
  original: 'test',
  detectorId: 'name',
});

describe('determineStatus', () => {
  it('returns needs_review when below-threshold detections exist', () => {
    expect(determineStatus([span(0.95)], true)).toBe('needs_review');
  });

  it('returns safe when no spans and no below-threshold', () => {
    expect(determineStatus([], false)).toBe('safe');
  });

  it('returns anonymized when all spans ≥ 0.9', () => {
    expect(determineStatus([span(0.95), span(0.99)], false)).toBe('anonymized');
  });

  it('returns anonymized for exactly 0.9 confidence', () => {
    expect(determineStatus([span(0.9)], false)).toBe('anonymized');
  });

  it('returns needs_review when some spans below 0.9', () => {
    expect(determineStatus([span(0.95), span(0.85)], false)).toBe('needs_review');
  });

  it('returns needs_review for single low-confidence span', () => {
    expect(determineStatus([span(0.7)], false)).toBe('needs_review');
  });

  it('prioritizes below-threshold over empty spans', () => {
    expect(determineStatus([], true)).toBe('needs_review');
  });
});
