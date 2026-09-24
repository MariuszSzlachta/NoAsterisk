import { KEYWORD_MATCH_THRESHOLD } from '#features/csv-import/model/parsing/data-boundary-detector/constants/keyword-match-threshold';
import { MAX_HEADER_CHECK_FIELDS } from '#features/csv-import/model/parsing/data-boundary-detector/constants/max-header-check-fields';
import { MIN_COLUMNS } from '#features/csv-import/model/parsing/data-boundary-detector/constants/min-columns';
import { countHeaderKeywordMatches } from '#features/csv-import/model/parsing/data-boundary-detector/helpers/count-header-keyword-matches';
import { isDateValue } from '#features/csv-import/model/parsing/data-boundary-detector/helpers/is-date-value';
import { LEADING_HASH_GLOBAL_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/leading-hash-global.pattern';
import { splitRespectingQuotes } from '#features/csv-import/model/parsing/shared/split-respecting-quotes';

export const isHeaderLine = (line: string, separator: string): boolean => {
  const fields = splitRespectingQuotes(line, separator);
  if (fields.length < MIN_COLUMNS) {
    return false;
  }
  if (fields.slice(0, MAX_HEADER_CHECK_FIELDS).some((f) => isDateValue(f))) {
    return false;
  }

  const normalized = line.replace(LEADING_HASH_GLOBAL_PATTERN, '');
  const keywordHits = countHeaderKeywordMatches(normalized);
  return keywordHits >= KEYWORD_MATCH_THRESHOLD;
};
