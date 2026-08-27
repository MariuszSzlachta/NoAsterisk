import type {
  DetectionSpan,
  DictionarySet,
  PiiDetector,
} from '#features/csv-import/model/anonymization/types';

import { MIN_CONFIDENCE } from './constants';
import { createMixedCaseNamePattern } from './patterns';
import {
  computeConfidence,
  findAllCapsNames,
  hasCompanyContext,
  hasNameContext,
  isWhitelisted,
  type MatchCandidate,
} from './validators';

const candidateKey = (c: MatchCandidate): string =>
  `${c.index}:${c.original.length}`;

const toDetectionSpan = (
  candidate: MatchCandidate,
  text: string,
  dictionaries: DictionarySet,
): DetectionSpan => {
  const { original, index: start } = candidate;
  const words = original.split(/[\s-]+/);
  const hasContext = hasNameContext(text, start);
  const confidence = computeConfidence(words, dictionaries, hasContext);

  return {
    start,
    end: start + original.length,
    type: 'name',
    confidence,
    original,
    detectorId: 'name',
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

export const nameDetector: PiiDetector = {
  id: 'name',
  priority: 50,

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
