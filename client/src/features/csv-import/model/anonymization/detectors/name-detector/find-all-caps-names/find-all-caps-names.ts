import { createAllCapsWordPattern } from '#features/csv-import/model/anonymization/detectors/name-detector/create-all-caps-word-pattern';
import type { MatchCandidate } from '#features/csv-import/model/anonymization/detectors/name-detector/match-candidate';

interface CapsWord {
  readonly word: string;
  readonly start: number;
}

export const findAllCapsNames = (text: string): MatchCandidate[] => {
  const words: readonly CapsWord[] = Array.from(
    text.matchAll(createAllCapsWordPattern()),
    (m) => ({ word: m[0], start: m.index }),
  );

  return words.reduce<MatchCandidate[]>((acc, a, i) => {
    const b = words[i + 1];
    if (b === undefined) {
      return acc;
    }

    const betweenAB = text.slice(a.start + a.word.length, b.start);
    if (!/^[\s-]+$/.test(betweenAB)) {
      return acc;
    }

    const twoWord: MatchCandidate = {
      original: text.slice(a.start, b.start + b.word.length),
      index: a.start,
    };

    const c = words[i + 2];
    const threeWordCandidates: MatchCandidate[] =
      c !== undefined &&
      /^[\s-]+$/.test(text.slice(b.start + b.word.length, c.start))
        ? [
            {
              original: text.slice(a.start, c.start + c.word.length),
              index: a.start,
            },
          ]
        : [];

    return [...acc, twoWord, ...threeWordCandidates];
  }, []);
};
