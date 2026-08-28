// ═══════════════════════════════════════════════════════════════════
// CSV Import — API: Fetch Dictionaries from Backend
// ═══════════════════════════════════════════════════════════════════

import type { DictionarySet } from '#features/csv-import/model/anonymization/types';
import { apiClient } from '#shared/api';

interface DictionaryApiResponse {
  readonly firstNames: readonly string[];
  readonly surnames: readonly string[];
  readonly merchants: readonly string[];
  readonly cities: readonly string[];
  readonly phrases: readonly string[];
}

/**
 * Runtime validation for dictionary API response.
 * Ensures the contract is intact before creating Sets.
 */
export const validateResponse = (data: unknown): DictionaryApiResponse => {
  if (typeof data !== 'object' || data === null) {
    throw new Error('[fetchDictionaries] Invalid response: not an object');
  }

  const obj = data as Record<string, unknown>;
  const requiredFields = [
    'firstNames',
    'surnames',
    'merchants',
    'cities',
    'phrases',
  ] as const;

  for (const field of requiredFields) {
    if (!Array.isArray(obj[field])) {
      throw new Error(
        `[fetchDictionaries] Invalid response: '${field}' is not an array`,
      );
    }
  }

  return obj as unknown as DictionaryApiResponse;
};

/**
 * Fetches PII dictionaries from backend API.
 * Backend returns pre-normalized strings (lowercase/uppercase per type).
 * Converts arrays to ReadonlySet for O(1) lookup in anonymization pipeline.
 */
export const fetchDictionaries = async (): Promise<DictionarySet> => {
  const raw = await apiClient.get<unknown>('/dictionaries');
  const data = validateResponse(raw);

  return {
    firstNames: new Set(data.firstNames),
    surnames: new Set(data.surnames),
    merchants: new Set(data.merchants),
    cities: new Set(data.cities),
    phrases: new Set(data.phrases),
  };
};
