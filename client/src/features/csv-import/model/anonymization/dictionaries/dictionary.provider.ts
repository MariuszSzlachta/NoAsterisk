import type { DictionaryProvider, DictionarySet } from '../types';
import citiesPl from './stubs/cities-pl.json';
import merchants from './stubs/merchants.json';
import namesEn from './stubs/names-en.json';
import namesPl from './stubs/names-pl.json';
import phrases from './stubs/phrases.json';
import surnamesPl from './stubs/surnames-pl.json';

const toSet = (
  items: readonly string[],
  transform: (s: string) => string,
): ReadonlySet<string> => new Set(items.map(transform));

export const buildFromStubs = (): DictionarySet => ({
  firstNames: toSet([...namesPl, ...namesEn], (s) => s.toLowerCase()),
  surnames: toSet(surnamesPl, (s) => s.toLowerCase()),
  merchants: toSet(merchants, (s) => s.toUpperCase()),
  cities: toSet(citiesPl, (s) => s.toUpperCase()),
  phrases: toSet(phrases, (s) => s.toLowerCase()),
});

/**
 * Factory: creates a DictionaryProvider with its own cache instance.
 * Pass a custom loader to override the default (bundled stubs).
 * Implements single-flight: concurrent loadAll() calls share one in-flight promise.
 */
export const createDictionaryProvider = (
  loader: () => Promise<DictionarySet> = async () => buildFromStubs(),
  options: { isStub?: boolean } = {},
): DictionaryProvider & { resetCache: () => void } => {
  let cache: DictionarySet | null = null;
  let inflight: Promise<DictionarySet> | null = null;
  const stubFallback = options.isStub ?? true;

  return {
    loadAll: async (): Promise<DictionarySet> => {
      if (cache) {
        return cache;
      }
      if (!inflight) {
        inflight = loader()
          .then((result) => {
            cache = result;
            inflight = null;
            return result;
          })
          .catch((err: unknown) => {
            inflight = null;
            throw err;
          });
      }
      return inflight;
    },
    isLoaded: (): boolean => cache !== null,
    isStubFallback: (): boolean => stubFallback,
    resetCache: (): void => {
      cache = null;
      inflight = null;
    },
  };
};

/** Dev/test provider — uses bundled JSON stubs only (no HTTP). */
export const devDictionaryProvider = createDictionaryProvider();

/** @deprecated Use dictionaryProvider from api/ for production, devDictionaryProvider for tests. */
export const resetDictionaryCache = (): void => {
  devDictionaryProvider.resetCache();
};
