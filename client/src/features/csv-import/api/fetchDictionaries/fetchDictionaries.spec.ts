// ═══════════════════════════════════════════════════════════════════
// CSV Import — API: fetchDictionaries Tests
// ═══════════════════════════════════════════════════════════════════

import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '#shared/api';

import { fetchDictionaries } from './fetchDictionaries';

vi.mock('#shared/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockGet = vi.mocked(apiClient.get);

describe('fetchDictionaries', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /dictionaries', async () => {
    mockGet.mockResolvedValue({
      firstNames: [],
      surnames: [],
      merchants: [],
      cities: [],
      phrases: [],
    });

    await fetchDictionaries();

    expect(mockGet).toHaveBeenCalledWith('/dictionaries');
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('converts arrays to Sets', async () => {
    mockGet.mockResolvedValue({
      firstNames: ['anna', 'jan'],
      surnames: ['kowalski'],
      merchants: ['BIEDRONKA', 'LIDL'],
      cities: ['WARSZAWA'],
      phrases: ['przelew'],
    });

    const result = await fetchDictionaries();

    expect(result.firstNames).toBeInstanceOf(Set);
    expect(result.surnames).toBeInstanceOf(Set);
    expect(result.merchants).toBeInstanceOf(Set);
    expect(result.cities).toBeInstanceOf(Set);
    expect(result.phrases).toBeInstanceOf(Set);
  });

  it('preserves all entries in Sets', async () => {
    mockGet.mockResolvedValue({
      firstNames: ['anna', 'jan', 'maria'],
      surnames: ['kowalski', 'nowak'],
      merchants: ['BIEDRONKA'],
      cities: ['WARSZAWA', 'KRAKÓW'],
      phrases: ['przelew', 'wpłata'],
    });

    const result = await fetchDictionaries();

    expect(result.firstNames.size).toBe(3);
    expect(result.firstNames.has('anna')).toBe(true);
    expect(result.firstNames.has('jan')).toBe(true);
    expect(result.surnames.size).toBe(2);
    expect(result.merchants.has('BIEDRONKA')).toBe(true);
    expect(result.cities.size).toBe(2);
    expect(result.phrases.size).toBe(2);
  });

  it('handles empty arrays', async () => {
    mockGet.mockResolvedValue({
      firstNames: [],
      surnames: [],
      merchants: [],
      cities: [],
      phrases: [],
    });

    const result = await fetchDictionaries();

    expect(result.firstNames.size).toBe(0);
    expect(result.surnames.size).toBe(0);
    expect(result.merchants.size).toBe(0);
    expect(result.cities.size).toBe(0);
    expect(result.phrases.size).toBe(0);
  });

  it('propagates API errors', async () => {
    mockGet.mockRejectedValue(new Error('HTTP 500: Internal Server Error'));

    await expect(fetchDictionaries()).rejects.toThrow(
      'HTTP 500: Internal Server Error',
    );
  });
});
