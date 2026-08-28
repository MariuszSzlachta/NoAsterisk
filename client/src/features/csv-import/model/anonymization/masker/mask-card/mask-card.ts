import { CARD_MIN_DIGITS_FOR_FULL_MASK } from '#features/csv-import/model/anonymization/masker/constants/card-min-digits-for-full-mask';
import { NON_DIGIT_PATTERN } from '#features/csv-import/model/anonymization/masker/constants/non-digit-pattern';
import { CARD_PREFIX_LENGTH } from '#features/csv-import/model/anonymization/masker/constants/card-prefix-length';
import { CARD_SUFFIX_LENGTH } from '#features/csv-import/model/anonymization/masker/constants/card-suffix-length';
import type { MaskFn } from '#features/csv-import/model/anonymization/masker/mask-fn';

export const maskCard: MaskFn = (s) => {
  const digits = s.replace(NON_DIGIT_PATTERN, '');
  if (digits.length >= CARD_MIN_DIGITS_FOR_FULL_MASK) {
    return `${digits.slice(0, CARD_PREFIX_LENGTH)} •••• •••• ${digits.slice(-CARD_SUFFIX_LENGTH)}`;
  }
  return `•••• •••• •••• ${s.slice(-CARD_SUFFIX_LENGTH)}`;
};
