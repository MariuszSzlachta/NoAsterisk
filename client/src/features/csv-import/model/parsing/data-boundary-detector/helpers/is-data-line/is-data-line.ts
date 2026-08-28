import { splitRespectingQuotes } from '#features/csv-import/model/parsing/shared/split-respecting-quotes';

import { DATE_CHECK_FIELDS } from '#features/csv-import/model/parsing/data-boundary-detector/constants/date-check-fields';
import { isDateValue } from '#features/csv-import/model/parsing/data-boundary-detector/helpers/is-date-value';
import { MIN_DATA_ROW_COLUMNS } from '#features/csv-import/model/parsing/data-boundary-detector/constants/min-data-row-columns';

export const isDataLine = (line: string, separator: string): boolean => {
  if (line.trim().length === 0) {
    return false;
  }
  const fields = splitRespectingQuotes(line, separator);
  if (fields.length < MIN_DATA_ROW_COLUMNS) {
    return false;
  }
  return fields.slice(0, DATE_CHECK_FIELDS).some((f) => isDateValue(f));
};
