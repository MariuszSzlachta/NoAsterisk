// ═══════════════════════════════════════════════════════════════════
// CSV Import — API: dictionaryProvider Tests (fetch with fallback)
// ═══════════════════════════════════════════════════════════════════

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DictionarySet } from '#features/csv-import/model/anonymization/types';

const mockFetchDictionaries = vi.fn<() => Promise<DictionarySet>>();

vi.mock('../fetchDictionaries', () => ({
  fetchDictionaries: (...args: unknown[]) => mockFetchDictionaries(...(args as [])),
}));

// Must import AFTER mocks are set up
const { dictionaryProvider } = await import('./dictionaryProvider');

const buildApiResponse = (): DictionarySet => ({
  firstNames: new Set(['anna', 'jan']),
  surnames: new Set(['kowalski']),
  merchants: new Set(['BIEDRONKA']),
  cities: new Set(['WARSZAWA']),
  phrases: new Set(['przelew']),
});

describe('dictionaryProvider', () => {
  beforeEach(() => {
    dictionaryProvider.resetCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    dictionaryProvider.resetCache();
  });

  it('returns API data on success', async () => {
    const apiData = buildApiResponse();
    mockFetchDictionaries.mockResolvedValue(apiData);

    const result = await dictionaryProvider.loadAll();

    expect(result).toBe(apiData);
    expect(mockFetchDictionaries).toHaveBeenCalledTimes(1);
  });

  it('falls back to stubs on API 500 error', async () => {
    mockFetchDictionaries.mockRejectedValue(new Error('HTTP 500: Internal Server Error'));

    const result = await dictionaryProvider.loadAll();

    // Should return valid DictionarySet from stubs
    expect(result.firstNames).toBeInstanceOf(Set);
    expect(result.surnames).toBeInstanceOf(Set);
    expect(result.merchants).toBeInstanceOf(Set);
    expect(result.cities).toBeInstanceOf(Set);
    expect(result.phrases).toBeInstanceOf(Set);
    // Stubs have content
    expect(result.firstNames.size).toBeGreaterThan(0);
  });

  it('falls back to stubs on network error (TypeError)', async () => {
    mockFetchDictionaries.mockRejectedValue(new TypeError('Failed to fetch'));

    const result = await dictionaryProvider.loadAll();

    expect(result.firstNames).toBeInstanceOf(Set);
    expect(result.firstNames.size).toBeGreaterThan(0);
  });

  it('caches result — only 1 HTTP request for multiple loadAll calls', async () => {
    const apiData = buildApiResponse();
    mockFetchDictionaries.mockResolvedValue(apiData);

    const result1 = await dictionaryProvider.loadAll();
    const result2 = await dictionaryProvider.loadAll();

    expect(result1).toBe(result2);
    expect(mockFetchDictionaries).toHaveBeenCalledTimes(1);
  });

  it('caches fallback result — no retry on subsequent calls', async () => {
    mockFetchDictionaries.mockRejectedValue(new Error('API down'));

    const result1 = await dictionaryProvider.loadAll();
    const result2 = await dictionaryProvider.loadAll();

    expect(result1).toBe(result2);
    expect(mockFetchDictionaries).toHaveBeenCalledTimes(1);
  });

  it('reports isLoaded correctly', async () => {
    mockFetchDictionaries.mockResolvedValue(buildApiResponse());

    expect(dictionaryProvider.isLoaded()).toBe(false);

    await dictionaryProvider.loadAll();

    expect(dictionaryProvider.isLoaded()).toBe(true);
  });

  it('resetCache allows fresh fetch', async () => {
    const firstData = buildApiResponse();
    const secondData: DictionarySet = {
      firstNames: new Set(['maria']),
      surnames: new Set(['nowak']),
      merchants: new Set(['LIDL']),
      cities: new Set(['KRAKÓW']),
      phrases: new Set(['wpłata']),
    };

    mockFetchDictionaries.mockResolvedValueOnce(firstData).mockResolvedValueOnce(secondData);

    const result1 = await dictionaryProvider.loadAll();
    dictionaryProvider.resetCache();
    const result2 = await dictionaryProvider.loadAll();

    expect(result1).toBe(firstData);
    expect(result2).toBe(secondData);
    expect(mockFetchDictionaries).toHaveBeenCalledTimes(2);
  });

  it('logs warning on fallback', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockFetchDictionaries.mockRejectedValue(new Error('offline'));

    await dictionaryProvider.loadAll();

    expect(warnSpy).toHaveBeenCalledWith(
      '[Dictionaries] Backend unavailable, using bundled stubs — reduced PII coverage',
    );
    warnSpy.mockRestore();
  });
});
