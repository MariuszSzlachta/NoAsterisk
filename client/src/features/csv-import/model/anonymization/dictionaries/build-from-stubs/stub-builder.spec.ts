import { describe, expect, it } from 'vitest';

import { buildFromStubs } from '#features/csv-import/model/anonymization/dictionaries/build-from-stubs';
import { toNormalizedSet } from '#features/csv-import/model/anonymization/dictionaries/to-normalized-set';

describe('toNormalizedSet', () => {
  it('applies transform to all items', () => {
    const result = toNormalizedSet(['Hello', 'World'], (s) => s.toUpperCase());
    expect(result.has('HELLO')).toBe(true);
    expect(result.has('WORLD')).toBe(true);
    expect(result.has('Hello')).toBe(false);
  });

  it('deduplicates after transform', () => {
    const result = toNormalizedSet(['abc', 'ABC', 'Abc'], (s) =>
      s.toLowerCase(),
    );
    expect(result.size).toBe(1);
  });

  it('returns empty set for empty input', () => {
    const result = toNormalizedSet([], (s) => s);
    expect(result.size).toBe(0);
  });
});

describe('buildFromStubs', () => {
  it('loads all five dictionaries', () => {
    const dicts = buildFromStubs();

    expect(dicts.firstNames.size).toBeGreaterThan(200);
    expect(dicts.surnames.size).toBeGreaterThan(100);
    expect(dicts.merchants.size).toBeGreaterThan(200);
    expect(dicts.cities.size).toBeGreaterThan(50);
    expect(dicts.phrases.size).toBeGreaterThan(50);
  });

  it('stores first names lowercased', () => {
    const dicts = buildFromStubs();
    expect(dicts.firstNames.has('jan')).toBe(true);
    expect(dicts.firstNames.has('JAN')).toBe(false);
  });

  it('stores surnames lowercased', () => {
    const dicts = buildFromStubs();
    expect(dicts.surnames.has('kowalski')).toBe(true);
    expect(dicts.surnames.has('KOWALSKI')).toBe(false);
  });

  it('stores merchants uppercased', () => {
    const dicts = buildFromStubs();
    expect(dicts.merchants.has('BIEDRONKA')).toBe(true);
    expect(dicts.merchants.has('biedronka')).toBe(false);
  });

  it('stores cities uppercased', () => {
    const dicts = buildFromStubs();
    expect(dicts.cities.has('WARSZAWA')).toBe(true);
    expect(dicts.cities.has('KRAKÓW')).toBe(true);
  });

  it('stores phrases lowercased', () => {
    const dicts = buildFromStubs();
    expect(dicts.phrases.has('przelew wychodzący')).toBe(true);
    expect(dicts.phrases.has('płatność kartą')).toBe(true);
  });

  it('includes English first names', () => {
    const dicts = buildFromStubs();
    expect(dicts.firstNames.has('john')).toBe(true);
  });

  it('has no merchant-name overlap for common false positives', () => {
    const dicts = buildFromStubs();
    expect(dicts.merchants.has('IKEA')).toBe(true);
    expect(dicts.merchants.has('POCZTA POLSKA')).toBe(true);
  });
});
