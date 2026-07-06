import { describe, expect, it } from 'vitest';

import { devDictionaryProvider } from './dictionary.provider';

describe('devDictionaryProvider', () => {
  it('loads all dictionaries', async () => {
    const dicts = await devDictionaryProvider.loadAll();

    expect(dicts.firstNames.size).toBeGreaterThan(200);
    expect(dicts.surnames.size).toBeGreaterThan(100);
    expect(dicts.merchants.size).toBeGreaterThan(200);
    expect(dicts.cities.size).toBeGreaterThan(50);
    expect(dicts.phrases.size).toBeGreaterThan(50);
  });

  it('stores first names lowercased', async () => {
    const dicts = await devDictionaryProvider.loadAll();

    expect(dicts.firstNames.has('jan')).toBe(true);
    expect(dicts.firstNames.has('anna')).toBe(true);
    expect(dicts.firstNames.has('john')).toBe(true);
    expect(dicts.firstNames.has('JAN')).toBe(false);
  });

  it('stores surnames lowercased', async () => {
    const dicts = await devDictionaryProvider.loadAll();

    expect(dicts.surnames.has('kowalski')).toBe(true);
    expect(dicts.surnames.has('nowak')).toBe(true);
    expect(dicts.surnames.has('KOWALSKI')).toBe(false);
  });

  it('stores merchants uppercased', async () => {
    const dicts = await devDictionaryProvider.loadAll();

    expect(dicts.merchants.has('BIEDRONKA')).toBe(true);
    expect(dicts.merchants.has('ALLEGRO')).toBe(true);
    expect(dicts.merchants.has('biedronka')).toBe(false);
  });

  it('stores cities uppercased', async () => {
    const dicts = await devDictionaryProvider.loadAll();

    expect(dicts.cities.has('WARSZAWA')).toBe(true);
    expect(dicts.cities.has('KRAKÓW')).toBe(true);
  });

  it('stores phrases lowercased', async () => {
    const dicts = await devDictionaryProvider.loadAll();

    expect(dicts.phrases.has('przelew wychodzący')).toBe(true);
    expect(dicts.phrases.has('płatność kartą')).toBe(true);
  });

  it('reports isLoaded after first load', async () => {
    await devDictionaryProvider.loadAll();

    expect(devDictionaryProvider.isLoaded()).toBe(true);
  });

  it('does NOT contain names in merchants (no overlap)', async () => {
    const dicts = await devDictionaryProvider.loadAll();

    // Common false positive scenarios — these should be in merchants, not names
    expect(dicts.merchants.has('IKEA')).toBe(true);
    expect(dicts.merchants.has('POCZTA POLSKA')).toBe(true);
  });
});
