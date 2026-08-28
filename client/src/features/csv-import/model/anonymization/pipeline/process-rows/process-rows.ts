import type { AnonymizationEntry } from '#features/csv-import/model/anonymization/types/anonymization-entry';
import type { DictionarySet } from '#features/csv-import/model/anonymization/types/dictionary-set';
import { anonymizeTitle } from '#features/csv-import/model/anonymization/pipeline/anonymize-title';

export const processRows = (
  titles: readonly string[],
  dictionaries: DictionarySet,
): readonly AnonymizationEntry[] =>
  titles.map((title, rowIndex) => {
    const { spans, masked, status } = anonymizeTitle(title, dictionaries);
    return {
      rowIndex,
      originalTitle: title,
      anonymizedTitle: masked,
      spans,
      status,
      accepted: status === 'safe' || status === 'anonymized',
    };
  });
