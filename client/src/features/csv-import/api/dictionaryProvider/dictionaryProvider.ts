// ═══════════════════════════════════════════════════════════════════
// CSV Import — API: Dictionary Provider (fetch with stub fallback)
// ═══════════════════════════════════════════════════════════════════

import { createDictionaryProvider } from '#features/csv-import/model/anonymization/dictionaries/dictionary-provider.factory';
import { buildFromStubs } from '#features/csv-import/model/anonymization/dictionaries/build-from-stubs';
import type { DictionarySet } from '#features/csv-import/model/anonymization/types';

import { fetchDictionaries } from '../fetchDictionaries';

/**
 * Tracks whether the provider had to fall back to stubs.
 * UI should check this and show a warning banner.
 */
let usedStubFallback = false;

/**
 * Loader that tries API first, falls back to bundled stubs on error.
 * Sets `usedStubFallback = true` so UI can inform the user of reduced PII coverage.
 */
const fetchWithFallback = async (): Promise<DictionarySet> => {
  try {
    const result = await fetchDictionaries();
    usedStubFallback = false;
    return result;
  } catch {
    console.warn(
      '[Dictionaries] Backend unavailable, using bundled stubs — reduced PII coverage',
    );
    usedStubFallback = true;
    return buildFromStubs();
  }
};

/** Production provider — fetches from API with stub fallback. */
export const dictionaryProvider = createDictionaryProvider(fetchWithFallback, {
  isStub: false,
});

/** Check if the last load used stub fallback (reduced coverage). */
export const isDictionaryStubFallback = (): boolean => usedStubFallback;
