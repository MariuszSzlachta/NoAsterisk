import type { MaskFn } from '#features/csv-import/model/anonymization/masker/mask-fn';
import { LEADING_QUOTE_PATTERN } from '#features/csv-import/model/anonymization/masker/constants/leading-quote-pattern';
import { WHITESPACE_PATTERN } from '#features/csv-import/model/anonymization/masker/constants/whitespace-pattern';
import { CARD_PREFIX_LENGTH } from '#features/csv-import/model/anonymization/masker/constants/card-prefix-length';
import { CARD_SUFFIX_LENGTH } from '#features/csv-import/model/anonymization/masker/constants/card-suffix-length';

export const maskIban: MaskFn = (s) => {
  const clean = s.replace(LEADING_QUOTE_PATTERN, '').replace(WHITESPACE_PATTERN, '');
  return `${clean.slice(0, CARD_PREFIX_LENGTH)} •••• •••• ${clean.slice(-CARD_SUFFIX_LENGTH)}`;
};
