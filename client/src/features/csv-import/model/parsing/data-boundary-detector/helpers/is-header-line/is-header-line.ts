import { LEADING_HASH_GLOBAL_PATTERN } from '#features/csv-import/model/parsing/shared';
import { splitRespectingQuotes } from '#features/csv-import/model/parsing/shared/split-respecting-quotes';

import { HEADER_KEYWORDS } from '#features/csv-import/model/parsing/data-boundary-detector/constants/header-keywords';
import { isDateValue } from '#features/csv-import/model/parsing/data-boundary-detector/helpers/is-date-value';
import { KEYWORD_MATCH_THRESHOLD } from '#features/csv-import/model/parsing/data-boundary-detector/constants/keyword-match-threshold';
import { MAX_HEADER_CHECK_FIELDS } from '#features/csv-import/model/parsing/data-boundary-detector/constants/max-header-check-fields';
import { MIN_COLUMNS } from '#features/csv-import/model/parsing/data-boundary-detector/constants/min-columns';

export const isHeaderLine = (line: string, separator: string): boolean => {
  const fields = splitRespectingQuotes(line, separator);
  if (fields.length < MIN_COLUMNS) {
    return false;
  }
  if (fields.slice(0, MAX_HEADER_CHECK_FIELDS).some((f) => isDateValue(f))) {
    return false;
  }

  const lower = line.toLowerCase().replace(LEADING_HASH_GLOBAL_PATTERN, '');
  const keywordHits = HEADER_KEYWORDS.filter((kw) => lower.includes(kw)).length;
  return keywordHits >= KEYWORD_MATCH_THRESHOLD;
};
