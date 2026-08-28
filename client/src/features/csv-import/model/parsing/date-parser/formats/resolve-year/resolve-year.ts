import { TWO_DIGIT_YEAR_BASE } from '#features/csv-import/model/parsing/date-parser/formats/resolve-year/constants/two-digit-year-base';
import { TWO_DIGIT_YEAR_THRESHOLD } from '#features/csv-import/model/parsing/date-parser/formats/resolve-year/constants/two-digit-year-threshold';

export const resolveYear = (yearStr: string): number | null => {
  const num = parseInt(yearStr, 10);
  if (isNaN(num)) {
    return null;
  }
  return num < TWO_DIGIT_YEAR_THRESHOLD ? TWO_DIGIT_YEAR_BASE + num : num;
};
