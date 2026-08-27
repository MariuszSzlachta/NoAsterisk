import { describe, expect, it } from 'vitest';

import type { DetectionSpan } from '#features/csv-import/model/anonymization/types';

import { applyMasking, maskSpan } from './pii.masker';

const makeSpan = (
  overrides: Partial<DetectionSpan> & {
    start: number;
    end: number;
    type: DetectionSpan['type'];
    original: string;
  },
): DetectionSpan => ({
  confidence: 0.95,
  detectorId: overrides.type,
  ...overrides,
});

describe('maskSpan', () => {
  it('delegates to the correct strategy by PiiType', () => {
    const span = makeSpan({ start: 0, end: 3, type: 'name', original: 'Jan' });
    expect(maskSpan(span)).toBe('J••');
  });
});

describe('applyMasking', () => {
  it('returns original text when no spans', () => {
    expect(applyMasking('Hello world', [])).toBe('Hello world');
  });

  it('masks single span in middle of text', () => {
    const text = 'PRZELEW Jan Kowalski za mieszkanie';
    const spans = [
      makeSpan({ start: 8, end: 20, type: 'name', original: 'Jan Kowalski' }),
    ];

    expect(applyMasking(text, spans)).toBe('PRZELEW J•• K•••••• za mieszkanie');
  });

  it('masks multiple consecutive spans', () => {
    const text = 'Od Jan Kowalski tel 601234567';
    const spans = [
      makeSpan({ start: 3, end: 15, type: 'name', original: 'Jan Kowalski' }),
      makeSpan({ start: 20, end: 29, type: 'phone', original: '601234567' }),
    ];

    const result = applyMasking(text, spans);
    expect(result).toContain('J•• K••••••');
    expect(result).toContain('••• ••• 567');
    expect(result).toContain('Od ');
    expect(result).toContain(' tel ');
  });

  it('handles span at start of text', () => {
    const text = 'Jan Kowalski przelew';
    const spans = [
      makeSpan({ start: 0, end: 12, type: 'name', original: 'Jan Kowalski' }),
    ];

    expect(applyMasking(text, spans)).toBe('J•• K•••••• przelew');
  });

  it('handles span at end of text', () => {
    const text = 'przelew od Jan Kowalski';
    const spans = [
      makeSpan({ start: 11, end: 23, type: 'name', original: 'Jan Kowalski' }),
    ];

    expect(applyMasking(text, spans)).toBe('przelew od J•• K••••••');
  });

  it('throws for overlapping spans', () => {
    const text = 'Jan Kowalski przelew';
    const spans = [
      makeSpan({ start: 0, end: 8, type: 'name', original: 'Jan Kowa' }),
      makeSpan({ start: 4, end: 12, type: 'name', original: 'Kowalski' }),
    ];

    expect(() => applyMasking(text, spans)).toThrow('Overlapping spans');
  });

  it('throws for out-of-bounds span', () => {
    const text = 'short';
    const spans = [
      makeSpan({ start: 0, end: 100, type: 'name', original: 'x'.repeat(100) }),
    ];

    expect(() => applyMasking(text, spans)).toThrow('Span out of bounds');
  });
});
