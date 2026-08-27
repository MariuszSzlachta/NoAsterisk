import type { DictionarySet } from '#features/csv-import/model/anonymization/types';
import citiesPl from './stubs/cities-pl.json';
import merchants from './stubs/merchants.json';
import namesEn from './stubs/names-en.json';
import namesPl from './stubs/names-pl.json';
import phrases from './stubs/phrases.json';
import surnamesPl from './stubs/surnames-pl.json';

export const toNormalizedSet = (
  items: readonly string[],
  transform: (s: string) => string,
): ReadonlySet<string> => new Set(items.map(transform));

export const buildFromStubs = (): DictionarySet => ({
  firstNames: toNormalizedSet([...namesPl, ...namesEn], (s) => s.toLowerCase()),
  surnames: toNormalizedSet(surnamesPl, (s) => s.toLowerCase()),
  merchants: toNormalizedSet(merchants, (s) => s.toUpperCase()),
  cities: toNormalizedSet(citiesPl, (s) => s.toUpperCase()),
  phrases: toNormalizedSet(phrases, (s) => s.toLowerCase()),
});
