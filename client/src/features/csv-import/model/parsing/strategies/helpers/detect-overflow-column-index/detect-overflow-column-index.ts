import { LEADING_HASH_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/leading-hash.pattern';

import { OVERFLOW_COLUMN_KEYWORDS } from '#features/csv-import/model/parsing/strategies/helpers/detect-overflow-column-index/constants/overflow-column-keywords';

export const detectOverflowColumnIndex = (
  headers: readonly string[],
): number | undefined => {
  const index = headers.findIndex((h) => {
    const normalized = h.toLowerCase().replace(LEADING_HASH_PATTERN, '').trim();
    return OVERFLOW_COLUMN_KEYWORDS.some((kw) => normalized.includes(kw));
  });

  return index === -1 ? undefined : index;
};
