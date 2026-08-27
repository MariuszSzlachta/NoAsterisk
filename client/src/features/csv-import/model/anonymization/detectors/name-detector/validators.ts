import { COMPANY_FORM_VARIANTS } from '#features/csv-import/model/anonymization/constants';
import type { DictionarySet } from '#features/csv-import/model/anonymization/types';

import {
  CONTEXT_ONLY_CONFIDENCE,
  DICT_MATCH_NO_CONTEXT_CONFIDENCE,
  FIRST_AND_SURNAME_CONFIDENCE,
  FIRST_NAME_WITH_CONTEXT_CONFIDENCE,
  NAME_CONTEXT_KEYWORDS,
  NO_MATCH_CONFIDENCE,
  SURNAME_WITH_CONTEXT_CONFIDENCE,
} from './constants';
import { createAllCapsWordPattern } from './patterns';

export interface MatchCandidate {
  readonly original: string;
  readonly index: number;
}

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

export const hasCompanyContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - 20), start).toLowerCase();
  return COMPANY_FORM_VARIANTS.some((cp) => prefix.includes(cp));
};

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

export const hasNameContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - 30), start).toLowerCase();
  return NAME_CONTEXT_KEYWORDS.some((kw) => prefix.includes(kw));
};

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
