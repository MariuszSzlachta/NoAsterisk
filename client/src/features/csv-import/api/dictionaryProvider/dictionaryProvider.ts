// ═══════════════════════════════════════════════════════════════════
// CSV Import — API: Dictionary Provider (fetch with stub fallback)
// ═══════════════════════════════════════════════════════════════════

import type { DictionarySet } from '#features/csv-import/model/anonymization/types';
import {
  buildFromStubs,
  createDictionaryProvider,
} from '#features/csv-import/model/anonymization/dictionaries/dictionary.provider';

import { fetchDictionaries } from '../fetchDictionaries';

/**
 * Loader that tries API first, falls back to bundled stubs on error.
 * Ensures anonymization works offline or when backend is unavailable.
 */
const fetchWithFallback = async (): Promise<DictionarySet> => {
  try {
    return await fetchDictionaries();
  } catch {
    console.warn('[Dictionaries] Backend unavailable, using bundled stubs');
    return buildFromStubs();
  }
};

/** Production provider — fetches from API with stub fallback. */
export const dictionaryProvider = createDictionaryProvider(fetchWithFallback);
