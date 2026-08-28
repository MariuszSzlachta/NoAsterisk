// ═══════════════════════════════════════════════════════════════════
// CSV Import — API: Dictionary Provider (fetch with stub fallback)
//
// R4-EXCEPTION: 2 exports (dictionaryProvider, isDictionaryStubFallback)
// are co-dependent — isDictionaryStubFallback reads module-scoped state
// written by the provider's loader. Cannot be split without breaking
// encapsulation of the fallback tracking.
// ═══════════════════════════════════════════════════════════════════

import { createDictionaryProvider } from '#features/csv-import/model/anonymization/dictionaries/dictionary-provider-factory';
import { buildFromStubs } from '#features/csv-import/model/anonymization/dictionaries/build-from-stubs';
import type { DictionarySet } from '#features/csv-import/model/anonymization/types';

import { fetchDictionaries } from '#features/csv-import/api/fetchDictionaries';

/**
 * Tracks whether the provider had to fall back to stubs.
 * UI should check this and show a warning banner.
 *
 * R5-EXCEPTION: Module-scoped mutable state — cannot be exported or
 * restructured without breaking the encapsulation of fallback tracking.
 * `usedStubFallback` is written by `fetchWithFallback` and read by
 * `isDictionaryStubFallback`; both must share the same mutable binding.
 */
let usedStubFallback = false;

/**
 * Loader that tries API first, falls back to bundled stubs on error.
 * Sets `usedStubFallback = true` so UI can inform the user of reduced PII coverage.
 *
 * R5-EXCEPTION: Module-scoped helper — mutates `usedStubFallback` above.
 * Extracting to a separate file would require re-exporting mutable state,
 * which defeats the purpose. Kept co-located intentionally.
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
