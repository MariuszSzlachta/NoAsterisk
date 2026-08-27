import { describe, expect, it } from 'vitest';

import type { DictionarySet } from '#features/csv-import/model/anonymization/types';
import { birthDateDetector } from './birth-date.detector';

const EMPTY_DICTS: DictionarySet = {
  firstNames: new Set(),
  surnames: new Set(),
  merchants: new Set(),
  cities: new Set(),
  phrases: new Set(),
};

describe('birthDateDetector', () => {
  it.each([
    ['ur. 15.03.1992', 'ur. 15.03.1992'],
    ['urodzona 15-03-1992', 'urodzona 15-03-1992'],
    ['data urodzenia: 15/03/92', 'data urodzenia: 15/03/92'],
    ['urodzony 01.01.1985', 'urodzony 01.01.1985'],
  ])('detects birth date in: "%s"', (input, expectedOriginal) => {
    const spans = birthDateDetector.detect(input, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].type).toBe('birth_date');
    expect(spans[0].original).toBe(expectedOriginal);
  });

  it('gives confidence 0.94 for detected birth dates', () => {
    const text = 'ur. 15.03.1992';
    const spans = birthDateDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].confidence).toBe(0.94);
  });

  it('does NOT detect bare date without context keyword', () => {
    const text = 'Data: 15.03.1992 transakcja';
    const spans = birthDateDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(0);
  });

  it('does NOT detect random numbers that look like dates', () => {
    const text = 'Faktura 12/03/24 opłacona';
    const spans = birthDateDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(0);
  });

  it('detects birth date embedded in longer text', () => {
    const text = 'Wpłata Jan Kowalski ur. 22.11.1988 przelew';
    const spans = birthDateDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].original).toBe('ur. 22.11.1988');
  });

  it('has correct priority and id', () => {
    expect(birthDateDetector.id).toBe('birth_date');
    expect(birthDateDetector.priority).toBe(60);
  });
});
