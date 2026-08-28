import type { MaskFn } from '#features/csv-import/model/anonymization/masker/mask-fn';
import { NON_DIGIT_PATTERN } from '#features/csv-import/model/anonymization/masker/constants/non-digit-pattern';
import { PESEL_PREFIX_LENGTH } from '#features/csv-import/model/anonymization/masker/constants/pesel-prefix-length';
import { PESEL_SUFFIX_LENGTH } from '#features/csv-import/model/anonymization/masker/constants/pesel-suffix-length';

export const maskPesel: MaskFn = (s) => {
  const digits = s.replace(NON_DIGIT_PATTERN, '');
  return `${digits.slice(0, PESEL_PREFIX_LENGTH)}•••••••${digits.slice(-PESEL_SUFFIX_LENGTH)}`;
};
