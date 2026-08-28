import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import type { DictionarySet } from '#features/csv-import/model/anonymization/types/dictionary-set';
import type { PiiDetector } from '#features/csv-import/model/anonymization/types/pii-detector';
import { MIN_CONFIDENCE } from '#features/csv-import/model/anonymization/detectors/name-detector/constants/min-confidence';
import { NAME_DETECTOR_ID } from '#features/csv-import/model/anonymization/detectors/name-detector/constants/name-detector-id';
import { NAME_PRIORITY } from '#features/csv-import/model/anonymization/detectors/name-detector/constants/name-priority';
import { createMixedCaseNamePattern } from '#features/csv-import/model/anonymization/detectors/name-detector/create-mixed-case-name-pattern';
import { findAllCapsNames } from '#features/csv-import/model/anonymization/detectors/name-detector/find-all-caps-names';
import { hasCompanyContext } from '#features/csv-import/model/anonymization/detectors/name-detector/has-company-context';
import { isWhitelisted } from '#features/csv-import/model/anonymization/detectors/name-detector/is-whitelisted';
import { candidateKey } from '#features/csv-import/model/anonymization/detectors/name-detector/candidate-key';
import { toDetectionSpan } from '#features/csv-import/model/anonymization/detectors/name-detector/to-detection-span';
import type { MatchCandidate } from '#features/csv-import/model/anonymization/detectors/name-detector/match-candidate';

export const nameDetector: PiiDetector = {
  id: NAME_DETECTOR_ID,
  priority: NAME_PRIORITY,

  detect(text: string, dictionaries: DictionarySet): readonly DetectionSpan[] {
    const mixedCaseCandidates: readonly MatchCandidate[] = Array.from(
      text.matchAll(createMixedCaseNamePattern()),
      (m) => ({ original: m[0], index: m.index }),
    );

    const allCapsCandidates: readonly MatchCandidate[] = findAllCapsNames(text);

    const allCandidates = [...mixedCaseCandidates, ...allCapsCandidates];

    const deduplicated = allCandidates.reduce<readonly MatchCandidate[]>(
      (acc, candidate) => {
        const key = candidateKey(candidate);
        const seen = new Set(acc.map(candidateKey));
        return seen.has(key) ? acc : [...acc, candidate];
      },
      [],
    );

    return deduplicated
      .filter((candidate) => !isWhitelisted(candidate.original, dictionaries))
      .filter((candidate) => !hasCompanyContext(text, candidate.index))
      .map((candidate) => toDetectionSpan(candidate, text, dictionaries))
      .filter((span) => span.confidence >= MIN_CONFIDENCE);
  },
};
