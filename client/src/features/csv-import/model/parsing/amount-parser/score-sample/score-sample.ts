import { AMOUNT_PREFIX_SUFFIX_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/amount-prefix-suffix.pattern';
import { DIGIT_SPACE_DIGIT_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/digit-space-digit.pattern';
import { DIGITS_ONLY_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/digits-only.pattern';
import { normalizeWhitespace } from '#features/csv-import/model/parsing/shared/text-normalizers/normalize-whitespace';
import { MAX_DECIMAL_DIGITS } from '#features/csv-import/model/parsing/amount-parser/score-sample/constants/max-decimal-digits';
import { ZERO_SCORE } from '#features/csv-import/model/parsing/amount-parser/score-sample/constants/zero-score';
import type { LocaleScore } from '#features/csv-import/model/parsing/amount-parser/score-sample/locale-score';

export const scoreSample = (raw: string): LocaleScore => {
  const s = normalizeWhitespace(raw.trim());
  if (!s || s === '') {
    return ZERO_SCORE;
  }

  const stripped = s.replace(AMOUNT_PREFIX_SUFFIX_PATTERN, '');
  const lastComma = stripped.lastIndexOf(',');
  const lastDot = stripped.lastIndexOf('.');

  if (lastComma > lastDot && lastComma > 0) {
    const afterComma = stripped.slice(lastComma + 1);
    if (afterComma.length <= MAX_DECIMAL_DIGITS && DIGITS_ONLY_PATTERN.test(afterComma)) {
      return { pl: 1, en: 0 };
    }
  }

  if (lastDot > lastComma && lastDot > 0) {
    const afterDot = stripped.slice(lastDot + 1);
    if (afterDot.length <= MAX_DECIMAL_DIGITS && DIGITS_ONLY_PATTERN.test(afterDot)) {
      return { pl: 0, en: 1 };
    }
  }

  if (DIGIT_SPACE_DIGIT_PATTERN.test(s)) {
    return { pl: 1, en: 0 };
  }

  return ZERO_SCORE;
};
