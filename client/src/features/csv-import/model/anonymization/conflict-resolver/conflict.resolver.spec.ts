import { describe, expect, it } from 'vitest';

import type { DetectionSpan } from '#features/csv-import/model/anonymization/types';

import { resolveConflicts } from './conflict.resolver';

const makeSpan = (
  overrides: Partial<DetectionSpan> & { start: number; end: number },
): DetectionSpan => ({
  type: 'name',
  confidence: 0.9,
  original: 'test',
  detectorId: 'test',
  ...overrides,
});

const PRIORITY_MAP = new Map<string, number>([
  ['iban', 90],
  ['card', 88],
  ['phone', 85],
  ['email', 70],
  ['name', 50],
  ['address', 40],
]);

describe('resolveConflicts', () => {
  it('returns empty array for empty input', () => {
    expect(resolveConflicts([], PRIORITY_MAP)).toEqual([]);
  });

  it('returns single span unchanged', () => {
    const span = makeSpan({ start: 0, end: 10, detectorId: 'name' });
    const result = resolveConflicts([span], PRIORITY_MAP);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(span);
  });

  it('keeps non-overlapping spans (sorted by position)', () => {
    const spans = [
      makeSpan({ start: 20, end: 30, detectorId: 'phone' }),
      makeSpan({ start: 0, end: 10, detectorId: 'name' }),
    ];

    const result = resolveConflicts(spans, PRIORITY_MAP);

    expect(result).toHaveLength(2);
    expect(result[0].start).toBe(0);
    expect(result[1].start).toBe(20);
  });

  it('higher priority detector wins on overlap', () => {
    const spans = [
      makeSpan({
        start: 5,
        end: 15,
        detectorId: 'name',
        original: 'Jan Kowal',
      }),
      makeSpan({
        start: 0,
        end: 20,
        detectorId: 'iban',
        original: 'PL61109010140000',
      }),
    ];

    const result = resolveConflicts(spans, PRIORITY_MAP);

    expect(result).toHaveLength(1);
    expect(result[0].detectorId).toBe('iban');
  });

  it('higher confidence wins when same priority', () => {
    const spans = [
      makeSpan({
        start: 0,
        end: 10,
        detectorId: 'name',
        confidence: 0.75,
        original: 'Abc Def',
      }),
      makeSpan({
        start: 0,
        end: 10,
        detectorId: 'name',
        confidence: 0.95,
        original: 'Jan Kowalski',
      }),
    ];

    const result = resolveConflicts(spans, PRIORITY_MAP);

    expect(result).toHaveLength(1);
    expect(result[0].confidence).toBe(0.95);
  });

  it('resolves multiple overlapping groups independently', () => {
    const spans = [
      // Group 1: positions 0-15
      makeSpan({ start: 0, end: 15, detectorId: 'iban', confidence: 0.99 }),
      makeSpan({ start: 5, end: 12, detectorId: 'name', confidence: 0.95 }),
      // Group 2: positions 20-35
      makeSpan({ start: 20, end: 35, detectorId: 'phone', confidence: 0.9 }),
      makeSpan({ start: 25, end: 30, detectorId: 'name', confidence: 0.8 }),
    ];

    const result = resolveConflicts(spans, PRIORITY_MAP);

    expect(result).toHaveLength(2);
    expect(result[0].detectorId).toBe('iban');
    expect(result[1].detectorId).toBe('phone');
  });

  it('uses priority 0 for unknown detector IDs', () => {
    const spans = [
      makeSpan({
        start: 0,
        end: 10,
        detectorId: 'unknown',
        confidence: 0.99,
      }),
      makeSpan({ start: 0, end: 10, detectorId: 'name', confidence: 0.5 }),
    ];

    const result = resolveConflicts(spans, PRIORITY_MAP);

    // name has priority 50, unknown has 0 → name wins
    expect(result).toHaveLength(1);
    expect(result[0].detectorId).toBe('name');
  });

  it('returns spans sorted by start position', () => {
    const spans = [
      makeSpan({ start: 50, end: 60, detectorId: 'phone' }),
      makeSpan({ start: 10, end: 20, detectorId: 'name' }),
      makeSpan({ start: 30, end: 40, detectorId: 'email' }),
    ];

    const result = resolveConflicts(spans, PRIORITY_MAP);

    expect(result.map((s) => s.start)).toEqual([10, 30, 50]);
  });

  it('handles adjacent (touching) spans as non-overlapping', () => {
    const spans = [
      makeSpan({ start: 0, end: 10, detectorId: 'name' }),
      makeSpan({ start: 10, end: 20, detectorId: 'phone' }),
    ];

    const result = resolveConflicts(spans, PRIORITY_MAP);

    // start < end AND end > start = overlap. start=10, end=10 → NOT overlapping
    expect(result).toHaveLength(2);
  });

  it('handles partially overlapping spans (not fully contained)', () => {
    const spans = [
      makeSpan({ start: 0, end: 15, detectorId: 'name', confidence: 0.8 }),
      makeSpan({ start: 10, end: 25, detectorId: 'phone', confidence: 0.9 }),
    ];

    const result = resolveConflicts(spans, PRIORITY_MAP);

    // phone has higher priority → wins
    expect(result).toHaveLength(1);
    expect(result[0].detectorId).toBe('phone');
  });
});
