import { splitRespectingQuotes } from '#features/csv-import/model/parsing/shared/split-respecting-quotes';

import { isDateValue } from './is-date-value';
import { MIN_DATA_ROW_COLUMNS } from '../constants/min-data-row-columns';

export const isDataLine = (line: string, separator: string): boolean => {
  if (line.trim().length === 0) {
    return false;
  }
  const fields = splitRespectingQuotes(line, separator);
  if (fields.length < MIN_DATA_ROW_COLUMNS) {
    return false;
  }
  return fields.slice(0, 2).some((f) => isDateValue(f));
};
