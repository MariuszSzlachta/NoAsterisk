import type { MatchCandidate } from '#features/csv-import/model/anonymization/detectors/name-detector/match-candidate';

export const candidateKey = (c: MatchCandidate): string =>
  `${c.index}:${c.original.length}`;
