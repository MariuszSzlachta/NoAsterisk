import type { DictionaryProvider, DictionarySet } from '../../types';
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

const buildFromStubs = (): DictionarySet => ({
  firstNames: toSet([...namesPl, ...namesEn], (s) => s.toLowerCase()),
  surnames: toSet(surnamesPl, (s) => s.toLowerCase()),
  merchants: toSet(merchants, (s) => s.toUpperCase()),
  cities: toSet(citiesPl, (s) => s.toUpperCase()),
  phrases: toSet(phrases, (s) => s.toLowerCase()),
});

/**
 * Factory: creates a DictionaryProvider with its own cache instance.
 * In production, pass a loader that fetches from API.
 * In dev/test, uses bundled JSON stubs.
 */
export const createDictionaryProvider = (
  loader: () => Promise<DictionarySet> = async () => buildFromStubs(),
): DictionaryProvider & { resetCache: () => void } => {
  let cache: DictionarySet | null = null;

  return {
    loadAll: async (): Promise<DictionarySet> => {
      if (!cache) {
        cache = await loader();
      }
      return cache;
    },
    isLoaded: (): boolean => cache !== null,
    resetCache: (): void => {
      cache = null;
    },
  };
};

/** Default dev provider — uses bundled JSON stubs. */
export const devDictionaryProvider = createDictionaryProvider();

/** @deprecated Use createDictionaryProvider() for new code. */
export const resetDictionaryCache = (): void => {
  devDictionaryProvider.resetCache();
};
