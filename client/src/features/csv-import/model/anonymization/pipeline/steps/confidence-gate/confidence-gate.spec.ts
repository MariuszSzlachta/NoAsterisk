import { describe, expect, it } from 'vitest';

import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';

import { applyConfidenceGate } from '#features/csv-import/model/anonymization/pipeline/steps/confidence-gate';

const span = (confidence: number): DetectionSpan => ({
  start: 0,
  end: 5,
  type: 'name',
  confidence,
  original: 'test',
  detectorId: 'name',
});

describe('applyConfidenceGate', () => {
  it('accepts spans at or above REVIEW_THRESHOLD (0.7)', () => {
    const result = applyConfidenceGate([span(0.7), span(0.95)]);
    expect(result.accepted).toHaveLength(2);
    expect(result.belowThreshold).toHaveLength(0);
  });

  it('rejects spans below REVIEW_THRESHOLD', () => {
    const result = applyConfidenceGate([span(0.3), span(0.69)]);
    expect(result.accepted).toHaveLength(0);
    expect(result.belowThreshold).toHaveLength(2);
  });

  it('splits mixed confidence spans correctly', () => {
    const result = applyConfidenceGate([
      span(0.95),
      span(0.5),
      span(0.7),
      span(0.3),
    ]);
    expect(result.accepted).toHaveLength(2);
    expect(result.belowThreshold).toHaveLength(2);
  });

  it('returns empty arrays for empty input', () => {
    const result = applyConfidenceGate([]);
    expect(result.accepted).toHaveLength(0);
    expect(result.belowThreshold).toHaveLength(0);
  });

  it('treats exactly 0.7 as accepted (inclusive threshold)', () => {
    const result = applyConfidenceGate([span(0.7)]);
    expect(result.accepted).toHaveLength(1);
    expect(result.belowThreshold).toHaveLength(0);
  });
});
