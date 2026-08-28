import { LEADING_HASH_PATTERN } from '#features/csv-import/model/parsing/shared';

export const OVERFLOW_COLUMN_KEYWORDS = [
  'opis operacji',
  'opis',
  'description',
  'tytuł',
  'title',
  'szczegóły',
  'details',
  'treść',
];

export const detectOverflowColumnIndex = (
  headers: readonly string[],
): number | undefined =>
  headers.findIndex((h) => {
    const normalized = h.toLowerCase().replace(LEADING_HASH_PATTERN, '').trim();
    return OVERFLOW_COLUMN_KEYWORDS.some((kw) => normalized.includes(kw));
  }) === -1
    ? undefined
    : headers.findIndex((h) => {
        const normalized = h
          .toLowerCase()
          .replace(LEADING_HASH_PATTERN, '')
          .trim();
        return OVERFLOW_COLUMN_KEYWORDS.some((kw) => normalized.includes(kw));
      });
