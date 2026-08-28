import { describe, expect, it } from 'vitest';

import type { DictionarySet } from '#features/csv-import/model/anonymization/types/dictionary-set';

import { computeConfidence } from '#features/csv-import/model/anonymization/detectors/name-detector/compute-confidence';

const DICTS: DictionarySet = {
  firstNames: new Set(['jan', 'anna', 'piotr']),
  surnames: new Set(['kowalski', 'nowak', 'wiśniewski']),
  merchants: new Set(['BIEDRONKA', 'ALLEGRO', 'POCZTA POLSKA']),
  cities: new Set(['WARSZAWA', 'KRAKÓW', 'POZNAŃ']),
  phrases: new Set(['przelew wychodzący', 'płatność kartą']),
};

describe('computeConfidence', () => {
  it('returns 0.95 when both first name and surname in dict', () => {
    expect(computeConfidence(['Jan', 'Kowalski'], DICTS, false)).toBe(0.95);
  });

  it('returns 0.85 when first name in dict + context', () => {
    expect(computeConfidence(['Jan', 'Xyz'], DICTS, true)).toBe(0.85);
  });

  it('returns 0.82 when surname in dict + context', () => {
    expect(computeConfidence(['Xyz', 'Kowalski'], DICTS, true)).toBe(0.82);
  });

  it('returns 0.72 when dict match but no context', () => {
    expect(computeConfidence(['Jan', 'Xyz'], DICTS, false)).toBe(0.72);
  });

  it('returns 0.65 when only context, no dict match', () => {
    expect(computeConfidence(['Xyz', 'Abc'], DICTS, true)).toBe(0.65);
  });

  it('returns 0.3 when no match and no context', () => {
    expect(computeConfidence(['Xyz', 'Abc'], DICTS, false)).toBe(0.3);
  });
});
