import type { MaskFn } from '#features/csv-import/model/anonymization/masker/mask-fn';
import { NON_DIGIT_PATTERN } from '#features/csv-import/model/anonymization/masker/constants/non-digit-pattern';
import { NIP_PREFIX_LENGTH } from '#features/csv-import/model/anonymization/masker/constants/nip-prefix-length';
import { NIP_SUFFIX_LENGTH } from '#features/csv-import/model/anonymization/masker/constants/nip-suffix-length';

export const maskNip: MaskFn = (s) => {
  const digits = s.replace(NON_DIGIT_PATTERN, '');
  return `${digits.slice(0, NIP_PREFIX_LENGTH)}-•••-••-${digits.slice(-NIP_SUFFIX_LENGTH)}`;
};
