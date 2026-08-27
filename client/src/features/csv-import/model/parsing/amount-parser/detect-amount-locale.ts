import {
  AMOUNT_PREFIX_SUFFIX_PATTERN,
  DIGIT_SPACE_DIGIT_PATTERN,
  DIGITS_ONLY_PATTERN,
} from '#features/csv-import/model/parsing/shared/patterns';
import { normalizeWhitespace } from '#features/csv-import/model/parsing/shared/text-normalizers';
import type { AmountLocale } from '#features/csv-import/model/parsing/types';

interface LocaleScore {
  readonly pl: number;
  readonly en: number;
}

export const scoreSample = (raw: string): LocaleScore => {
  const s = normalizeWhitespace(raw.trim());
  if (!s || s === '') {
    return { pl: 0, en: 0 };
  }

  const stripped = s.replace(AMOUNT_PREFIX_SUFFIX_PATTERN, '');
  const lastComma = stripped.lastIndexOf(',');
  const lastDot = stripped.lastIndexOf('.');

  if (lastComma > lastDot && lastComma > 0) {
    const afterComma = stripped.slice(lastComma + 1);
    if (afterComma.length <= 2 && DIGITS_ONLY_PATTERN.test(afterComma)) {
      return { pl: 1, en: 0 };
    }
  }

  if (lastDot > lastComma && lastDot > 0) {
    const afterDot = stripped.slice(lastDot + 1);
    if (afterDot.length <= 2 && DIGITS_ONLY_PATTERN.test(afterDot)) {
      return { pl: 0, en: 1 };
    }
  }

  if (DIGIT_SPACE_DIGIT_PATTERN.test(s)) {
    return { pl: 1, en: 0 };
  }

  return { pl: 0, en: 0 };
};

export const detectAmountLocale = (
  samples: readonly string[],
): AmountLocale => {
  const totals = samples.reduce<LocaleScore>(
    (acc, sample) => {
      const score = scoreSample(sample);
      return { pl: acc.pl + score.pl, en: acc.en + score.en };
    },
    { pl: 0, en: 0 },
  );

  return totals.pl >= totals.en ? 'pl' : 'en';
};
