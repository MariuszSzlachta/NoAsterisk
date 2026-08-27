import type { DictionarySet } from '#features/csv-import/model/anonymization/types';

export const isWhitelisted = (text: string, dicts: DictionarySet): boolean => {
  const upper = text.toUpperCase();
  const lower = text.toLowerCase();

  if (dicts.merchants.has(upper)) {
    return true;
  }

  const words = text.split(/[\s-]+/);
  if (words.every((w) => dicts.cities.has(w.toUpperCase()))) {
    return true;
  }
  if (dicts.phrases.has(lower)) {
    return true;
  }

  if (
    words.length <= 3 &&
    dicts.merchants.has(words.map((w) => w.toUpperCase()).join(' '))
  ) {
    return true;
  }

  if (
    words.every(
      (w) =>
        dicts.merchants.has(w.toUpperCase()) ||
        dicts.cities.has(w.toUpperCase()),
    )
  ) {
    return true;
  }

  return false;
};
