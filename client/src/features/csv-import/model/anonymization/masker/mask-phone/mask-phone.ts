import type { MaskFn } from '#features/csv-import/model/anonymization/masker/mask-fn';
import { NON_DIGIT_PATTERN } from '#features/csv-import/model/anonymization/masker/constants/non-digit-pattern';
import { PHONE_SUFFIX_LENGTH } from '#features/csv-import/model/anonymization/masker/constants/phone-suffix-length';

export const maskPhone: MaskFn = (s) => {
  const digits = s.replace(NON_DIGIT_PATTERN, '');
  return `••• ••• ${digits.slice(-PHONE_SUFFIX_LENGTH)}`;
};
