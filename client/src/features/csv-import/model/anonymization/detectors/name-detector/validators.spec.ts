import { describe, expect, it } from 'vitest';

import type { DictionarySet } from '#features/csv-import/model/anonymization/types';

import {
  computeConfidence,
  findAllCapsNames,
  hasCompanyContext,
  hasNameContext,
  isWhitelisted,
} from './validators';

const DICTS: DictionarySet = {
  firstNames: new Set(['jan', 'anna', 'piotr']),
  surnames: new Set(['kowalski', 'nowak', 'wiśniewski']),
  merchants: new Set(['BIEDRONKA', 'ALLEGRO', 'POCZTA POLSKA']),
  cities: new Set(['WARSZAWA', 'KRAKÓW', 'POZNAŃ']),
  phrases: new Set(['przelew wychodzący', 'płatność kartą']),
};

describe('findAllCapsNames', () => {
  it('finds two adjacent ALL-CAPS words', () => {
    const results = findAllCapsNames('JAN KOWALSKI opłata');

    expect(results).toHaveLength(1);
    expect(results[0]?.original).toBe('JAN KOWALSKI');
    expect(results[0]?.index).toBe(0);
  });

  it('finds three adjacent ALL-CAPS words', () => {
    const results = findAllCapsNames('JAN MARIA KOWALSKI');

    expect(results.some((r) => r.original === 'JAN MARIA')).toBe(true);
    expect(results.some((r) => r.original === 'JAN MARIA KOWALSKI')).toBe(true);
  });

  it('finds words separated by hyphen', () => {
    const results = findAllCapsNames('NOWAK-WIŚNIEWSKA test');

    expect(results).toHaveLength(1);
    expect(results[0]?.original).toBe('NOWAK-WIŚNIEWSKA');
  });

  it('returns empty for single ALL-CAPS word', () => {
    const results = findAllCapsNames('KOWALSKI test');

    expect(results).toHaveLength(0);
  });

  it('returns empty for non-adjacent ALL-CAPS words', () => {
    const results = findAllCapsNames('JAN opłata KOWALSKI');

    expect(results).toHaveLength(0);
  });

  it('returns empty for empty string', () => {
    const results = findAllCapsNames('');

    expect(results).toHaveLength(0);
  });

  it('handles multiple pairs in one text', () => {
    const results = findAllCapsNames('JAN KOWALSKI przelew ANNA NOWAK');

    const originals = results.map((r) => r.original);
    expect(originals).toContain('JAN KOWALSKI');
    expect(originals).toContain('ANNA NOWAK');
  });
});

describe('hasCompanyContext', () => {
  it('returns true when company prefix found before start', () => {
    expect(hasCompanyContext('sp. z o.o. Jan Kowalski', 11)).toBe(true);
  });

  it('returns false when no company prefix before start', () => {
    expect(hasCompanyContext('Przelew Jan Kowalski', 9)).toBe(false);
  });

  it('returns true for PHU abbreviation', () => {
    expect(hasCompanyContext('PHU Jan Kowalski', 4)).toBe(true);
  });
});

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

describe('hasNameContext', () => {
  it('returns true when context keyword found before start', () => {
    expect(hasNameContext('Przelew od Jan Kowalski', 13)).toBe(true);
  });

  it('returns false when no context keyword before start', () => {
    expect(hasNameContext('Jakiś tekst Jan Kowalski', 13)).toBe(false);
  });

  it('returns true for "nadawca" keyword', () => {
    expect(hasNameContext('nadawca Jan Kowalski', 8)).toBe(true);
  });

  it('returns false when keyword is too far away', () => {
    const text = 'przelew ' + 'x'.repeat(30) + 'Jan Kowalski';
    expect(hasNameContext(text, 38)).toBe(false);
  });
});

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
