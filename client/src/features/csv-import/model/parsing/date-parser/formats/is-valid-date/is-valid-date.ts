import { MAX_DAY } from '#features/csv-import/model/parsing/date-parser/formats/is-valid-date/constants/max-day';
import { MAX_MONTH } from '#features/csv-import/model/parsing/date-parser/formats/is-valid-date/constants/max-month';
import { MIN_DAY } from '#features/csv-import/model/parsing/date-parser/formats/is-valid-date/constants/min-day';
import { MIN_MONTH } from '#features/csv-import/model/parsing/date-parser/formats/is-valid-date/constants/min-month';

export const isValidDate = (
  year: number,
  month: number,
  day: number,
): boolean => {
  if (month < MIN_MONTH || month > MAX_MONTH || day < MIN_DAY || day > MAX_DAY) {
    return false;
  }
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
};
