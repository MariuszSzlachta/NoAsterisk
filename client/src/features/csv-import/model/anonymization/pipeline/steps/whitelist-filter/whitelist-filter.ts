import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import type { DictionarySet } from '#features/csv-import/model/anonymization/types/dictionary-set';
import { MAX_MERCHANT_WORDS } from '#features/csv-import/model/anonymization/pipeline/steps/whitelist-filter/constants/max-merchant-words';
import { WORD_SPLIT_PATTERN } from '#features/csv-import/model/anonymization/pipeline/steps/whitelist-filter/constants/word-split-pattern';

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

    const words = span.original.split(WORD_SPLIT_PATTERN);
    if (
      words.length <= MAX_MERCHANT_WORDS &&
      dictionaries.merchants.has(words.map((w) => w.toUpperCase()).join(' '))
    ) {
      return false;
    }

    return true;
  });
