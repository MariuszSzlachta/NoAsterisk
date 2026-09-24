import { HEADER_KEYWORDS } from '#features/csv-import/model/parsing/data-boundary-detector/constants/header-keywords';

const COMBINING_MARK_PATTERN = /\p{M}/gu;

const normalize = (value: string): string =>
  value.normalize('NFKD').replace(COMBINING_MARK_PATTERN, '').toLowerCase();

const NORMALIZED_HEADER_KEYWORDS = HEADER_KEYWORDS.map(normalize);

export const countHeaderKeywordMatches = (value: string): number => {
  const normalized = normalize(value);
  return NORMALIZED_HEADER_KEYWORDS.filter((keyword) =>
    normalized.includes(keyword),
  ).length;
};
