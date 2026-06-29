import type { DictionaryProvider, DictionarySet } from '../types';

import namesPl from './stubs/names-pl.json';
import namesEn from './stubs/names-en.json';
import surnamesPl from './stubs/surnames-pl.json';
import merchants from './stubs/merchants.json';
import citiesPl from './stubs/cities-pl.json';
import phrases from './stubs/phrases.json';

const toSet = (items: readonly string[], transform: (s: string) => string): ReadonlySet<string> =>
  new Set(items.map(transform));

const buildDictionarySet = (): DictionarySet => ({
  firstNames: toSet([...namesPl, ...namesEn], (s) => s.toLowerCase()),
  surnames: toSet(surnamesPl, (s) => s.toLowerCase()),
  merchants: toSet(merchants, (s) => s.toUpperCase()),
  cities: toSet(citiesPl, (s) => s.toUpperCase()),
  phrases: toSet(phrases, (s) => s.toLowerCase()),
});

let cachedSet: DictionarySet | null = null;

/**
 * Dev implementation — loads from bundled JSON stubs.
 * In production, replace with API-based provider.
 */
export const devDictionaryProvider: DictionaryProvider = {
  loadAll: async (): Promise<DictionarySet> => {
    if (!cachedSet) {
      cachedSet = buildDictionarySet();
    }
    return cachedSet;
  },
  isLoaded: (): boolean => cachedSet !== null,
};

/** Reset cache — for testing only. */
export const resetDictionaryCache = (): void => {
  cachedSet = null;
};
