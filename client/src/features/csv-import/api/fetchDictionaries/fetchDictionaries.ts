// ═══════════════════════════════════════════════════════════════════
// CSV Import — API: Fetch Dictionaries from Backend
// ═══════════════════════════════════════════════════════════════════

import { apiClient } from '#shared/api';
import type { DictionarySet } from '#features/csv-import/model/anonymization/types';

interface DictionaryApiResponse {
  readonly firstNames: readonly string[];
  readonly surnames: readonly string[];
  readonly merchants: readonly string[];
  readonly cities: readonly string[];
  readonly phrases: readonly string[];
}

/**
 * Fetches PII dictionaries from backend API.
 * Backend returns pre-normalized strings (lowercase/uppercase per type).
 * Converts arrays to ReadonlySet for O(1) lookup in anonymization pipeline.
 */
export const fetchDictionaries = async (): Promise<DictionarySet> => {
  const data = await apiClient.get<DictionaryApiResponse>('/dictionaries');

  return {
    firstNames: new Set(data.firstNames),
    surnames: new Set(data.surnames),
    merchants: new Set(data.merchants),
    cities: new Set(data.cities),
    phrases: new Set(data.phrases),
  };
};
