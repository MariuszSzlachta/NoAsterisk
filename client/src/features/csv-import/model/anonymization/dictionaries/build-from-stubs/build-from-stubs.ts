import type { DictionarySet } from '#features/csv-import/model/anonymization/types/dictionary-set';

import citiesPl from '#features/csv-import/model/anonymization/dictionaries/stubs/cities-pl.json';
import merchants from '#features/csv-import/model/anonymization/dictionaries/stubs/merchants.json';
import namesEn from '#features/csv-import/model/anonymization/dictionaries/stubs/names-en.json';
import namesPl from '#features/csv-import/model/anonymization/dictionaries/stubs/names-pl.json';
import phrases from '#features/csv-import/model/anonymization/dictionaries/stubs/phrases.json';
import surnamesPl from '#features/csv-import/model/anonymization/dictionaries/stubs/surnames-pl.json';
import { toNormalizedSet } from '#features/csv-import/model/anonymization/dictionaries/to-normalized-set';

export const buildFromStubs = (): DictionarySet => ({
  firstNames: toNormalizedSet([...namesPl, ...namesEn], (s) => s.toLowerCase()),
  surnames: toNormalizedSet(surnamesPl, (s) => s.toLowerCase()),
  merchants: toNormalizedSet(merchants, (s) => s.toUpperCase()),
  cities: toNormalizedSet(citiesPl, (s) => s.toUpperCase()),
  phrases: toNormalizedSet(phrases, (s) => s.toLowerCase()),
});
