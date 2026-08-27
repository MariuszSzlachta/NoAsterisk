import { describe, expect, it } from 'vitest';

import type { DetectionSpan } from '#features/csv-import/model/anonymization/types';

import { validateSpanInvariants } from './validate-spans';

const span = (start: number, end: number): DetectionSpan => ({
  start,
  end,
  type: 'name',
  confidence: 0.9,
  original: 'x'.repeat(Math.max(0, end - start)),
  detectorId: 'name',
});

describe('validateSpanInvariants', () => {
  it('accepts empty spans', () => {
    expect(() => validateSpanInvariants([], 10)).not.toThrow();
  });

  it('accepts sorted, non-overlapping spans within bounds', () => {
    expect(() =>
      validateSpanInvariants([span(0, 3), span(5, 8)], 10),
    ).not.toThrow();
  });

  it('accepts adjacent spans (end === start of next)', () => {
    expect(() =>
      validateSpanInvariants([span(0, 3), span(3, 6)], 10),
    ).not.toThrow();
  });

  it('throws for negative start', () => {
    expect(() => validateSpanInvariants([span(-1, 3)], 10)).toThrow(
      'Span out of bounds',
    );
  });

  it('throws for end exceeding text length', () => {
    expect(() => validateSpanInvariants([span(0, 15)], 10)).toThrow(
      'Span out of bounds',
    );
  });

  it('throws for zero-length span (start === end)', () => {
    expect(() => validateSpanInvariants([span(3, 3)], 10)).toThrow(
      'Span out of bounds',
    );
  });

  it('throws for inverted span (start > end)', () => {
    expect(() => validateSpanInvariants([span(5, 3)], 10)).toThrow(
      'Span out of bounds',
    );
  });

  it('throws for overlapping spans', () => {
    expect(() => validateSpanInvariants([span(0, 5), span(3, 8)], 10)).toThrow(
      'Overlapping spans',
    );
  });

  it('includes index in error message', () => {
    expect(() => validateSpanInvariants([span(0, 5), span(3, 8)], 10)).toThrow(
      'at index 1',
    );
  });
});
