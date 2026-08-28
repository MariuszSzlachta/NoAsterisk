import { MAX_DATE_YEAR } from '#features/csv-import/model/transformation/row-transformer/constants/max-date-year';
import { MIN_DATE_YEAR } from '#features/csv-import/model/transformation/row-transformer/constants/min-date-year';

import { DECIMAL_RADIX } from '#features/csv-import/model/transformation/row-transformer/is-date-in-range/constants/decimal-radix';
import { YEAR_END_INDEX } from '#features/csv-import/model/transformation/row-transformer/is-date-in-range/constants/year-end-index';
import { YEAR_START_INDEX } from '#features/csv-import/model/transformation/row-transformer/is-date-in-range/constants/year-start-index';

export const isDateInRange = (isoDate: string): boolean => {
  const year = parseInt(isoDate.slice(YEAR_START_INDEX, YEAR_END_INDEX), DECIMAL_RADIX);
  return year >= MIN_DATE_YEAR && year <= MAX_DATE_YEAR;
};
