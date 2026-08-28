import { describe, expect, it } from 'vitest';

import type { DictionarySet } from '#features/csv-import/model/anonymization/types/dictionary-set';

import { isWhitelisted } from '#features/csv-import/model/anonymization/detectors/name-detector/is-whitelisted';

const DICTS: DictionarySet = {
  firstNames: new Set(['jan', 'anna', 'piotr']),
  surnames: new Set(['kowalski', 'nowak', 'wiśniewski']),
  merchants: new Set(['BIEDRONKA', 'ALLEGRO', 'POCZTA POLSKA']),
  cities: new Set(['WARSZAWA', 'KRAKÓW', 'POZNAŃ']),
  phrases: new Set(['przelew wychodzący', 'płatność kartą']),
};

describe('isWhitelisted', () => {
  it('returns true for known merchant', () => {
    expect(isWhitelisted('BIEDRONKA', DICTS)).toBe(true);
  });

  it('returns true for multi-word merchant', () => {
    expect(isWhitelisted('Poczta Polska', DICTS)).toBe(true);
  });

  it('returns true when all words are cities', () => {
    expect(isWhitelisted('WARSZAWA KRAKÓW', DICTS)).toBe(true);
  });

  it('returns true for known phrase', () => {
    expect(isWhitelisted('przelew wychodzący', DICTS)).toBe(true);
  });

  it('returns true for merchant + city combo', () => {
    expect(isWhitelisted('BIEDRONKA WARSZAWA', DICTS)).toBe(true);
  });

  it('returns false for unknown text', () => {
    expect(isWhitelisted('Jan Kowalski', DICTS)).toBe(false);
  });
});
