import type {
  DetectionSpan,
  DictionarySet,
} from '#features/csv-import/model/anonymization/types';

/**
 * Architecture doc § 4 step 3: discard spans whose text matches known entities
 * (merchants, cities, common phrases).
 */
export const filterByWhitelist = (
  spans: readonly DetectionSpan[],
  dictionaries: DictionarySet,
): readonly DetectionSpan[] =>
  spans.filter((span) => {
    const upper = span.original.toUpperCase();
    const lower = span.original.toLowerCase();

    if (dictionaries.merchants.has(upper)) {
      return false;
    }
    if (dictionaries.cities.has(upper)) {
      return false;
    }
    if (dictionaries.phrases.has(lower)) {
      return false;
    }

    const words = span.original.split(/\s+/);
    if (
      words.length <= 3 &&
      dictionaries.merchants.has(words.map((w) => w.toUpperCase()).join(' '))
    ) {
      return false;
    }

    return true;
  });
