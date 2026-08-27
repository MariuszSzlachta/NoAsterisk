import type { DictionarySet } from '#features/csv-import/model/anonymization/types';

import { CONTEXT_ONLY_CONFIDENCE } from './context-only-confidence';
import { DICT_MATCH_NO_CONTEXT_CONFIDENCE } from './dict-match-no-context-confidence';
import { FIRST_AND_SURNAME_CONFIDENCE } from './first-and-surname-confidence';
import { FIRST_NAME_WITH_CONTEXT_CONFIDENCE } from './first-name-with-context-confidence';
import { NO_MATCH_CONFIDENCE } from './no-match-confidence';
import { SURNAME_WITH_CONTEXT_CONFIDENCE } from './surname-with-context-confidence';

export const computeConfidence = (
  words: readonly string[],
  dicts: DictionarySet,
  hasContext: boolean,
): number => {
  const lowered = words.map((w) => w.toLowerCase());
  const anyFirstName = lowered.some((w) => dicts.firstNames.has(w));
  const anySurname = lowered.some((w) => dicts.surnames.has(w));

  if (anyFirstName && anySurname) {
    return FIRST_AND_SURNAME_CONFIDENCE;
  }
  if (anyFirstName && hasContext) {
    return FIRST_NAME_WITH_CONTEXT_CONFIDENCE;
  }
  if (anySurname && hasContext) {
    return SURNAME_WITH_CONTEXT_CONFIDENCE;
  }
  if ((anyFirstName || anySurname) && !hasContext) {
    return DICT_MATCH_NO_CONTEXT_CONFIDENCE;
  }
  if (hasContext) {
    return CONTEXT_ONLY_CONFIDENCE;
  }
  return NO_MATCH_CONFIDENCE;
};
