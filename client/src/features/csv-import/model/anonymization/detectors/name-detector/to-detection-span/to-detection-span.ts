import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import type { DictionarySet } from '#features/csv-import/model/anonymization/types/dictionary-set';
import { computeConfidence } from '#features/csv-import/model/anonymization/detectors/name-detector/compute-confidence';
import { hasNameContext } from '#features/csv-import/model/anonymization/detectors/name-detector/has-name-context';
import { NAME_DETECTOR_ID } from '#features/csv-import/model/anonymization/detectors/name-detector/constants/name-detector-id';
import { WORD_SPLIT_PATTERN } from '#features/csv-import/model/anonymization/detectors/name-detector/constants/word-split-pattern';
import type { MatchCandidate } from '#features/csv-import/model/anonymization/detectors/name-detector/match-candidate';

export const toDetectionSpan = (
  candidate: MatchCandidate,
  text: string,
  dictionaries: DictionarySet,
): DetectionSpan => {
  const { original, index: start } = candidate;
  const words = original.split(WORD_SPLIT_PATTERN);
  const hasContext = hasNameContext(text, start);
  const confidence = computeConfidence(words, dictionaries, hasContext);

  return {
    start,
    end: start + original.length,
    type: 'name',
    confidence,
    original,
    detectorId: NAME_DETECTOR_ID,
    metadata: {
      anyFirstNameInDict: words.some((w) =>
        dictionaries.firstNames.has(w.toLowerCase()),
      ),
      anySurnameInDict: words.some((w) =>
        dictionaries.surnames.has(w.toLowerCase()),
      ),
      hasContext,
    },
  };
};
