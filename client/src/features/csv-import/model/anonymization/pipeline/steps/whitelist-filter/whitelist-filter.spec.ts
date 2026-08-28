import { describe, expect, it } from 'vitest';

import type {
  DetectionSpan,
  DictionarySet,
} from '#features/csv-import/model/anonymization/types';

import { filterByWhitelist } from '#features/csv-import/model/anonymization/pipeline/steps/whitelist-filter';

const DICTS: DictionarySet = {
  firstNames: new Set(),
  surnames: new Set(),
  merchants: new Set(['BIEDRONKA', 'POCZTA POLSKA']),
  cities: new Set(['WARSZAWA']),
  phrases: new Set(['przelew wychodzący']),
};

const span = (original: string, type = 'name'): DetectionSpan => ({
  start: 0,
  end: original.length,
  type: type as DetectionSpan['type'],
  confidence: 0.9,
  original,
  detectorId: type,
});

describe('filterByWhitelist', () => {
  it('removes spans matching merchants (case-insensitive)', () => {
    const result = filterByWhitelist([span('Biedronka')], DICTS);
    expect(result).toHaveLength(0);
  });

  it('removes spans matching cities', () => {
    const result = filterByWhitelist([span('Warszawa')], DICTS);
    expect(result).toHaveLength(0);
  });

  it('removes spans matching phrases (lowercase)', () => {
    const result = filterByWhitelist([span('Przelew Wychodzący')], DICTS);
    expect(result).toHaveLength(0);
  });

  it('removes multi-word merchant matches (≤3 words)', () => {
    const result = filterByWhitelist([span('Poczta Polska')], DICTS);
    expect(result).toHaveLength(0);
  });

  it('keeps spans not in any whitelist', () => {
    const result = filterByWhitelist([span('Jan Kowalski')], DICTS);
    expect(result).toHaveLength(1);
    expect(result[0]?.original).toBe('Jan Kowalski');
  });

  it('returns empty for empty input', () => {
    const result = filterByWhitelist([], DICTS);
    expect(result).toHaveLength(0);
  });

  it('keeps non-matching spans while removing matching ones', () => {
    const result = filterByWhitelist(
      [span('Biedronka'), span('Jan Kowalski'), span('Warszawa')],
      DICTS,
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.original).toBe('Jan Kowalski');
  });
});
