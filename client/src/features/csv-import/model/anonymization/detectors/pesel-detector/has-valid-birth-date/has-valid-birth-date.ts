import { PESEL_MONTH_RANGES } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/pesel-month-ranges';
import { RADIX } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/radix';
import { PESEL_MONTH_START } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/pesel-month-start';
import { PESEL_MONTH_END } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/pesel-month-end';
import { PESEL_DAY_START } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/pesel-day-start';
import { PESEL_DAY_END } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/pesel-day-end';
import { MIN_MONTH } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/min-month';
import { MAX_MONTH } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/max-month';
import { MIN_DAY } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/min-day';
import { MAX_DAY } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/max-day';

export const hasValidBirthDate = (digits: string): boolean => {
  const monthRaw = parseInt(digits.slice(PESEL_MONTH_START, PESEL_MONTH_END), RADIX);
  const day = parseInt(digits.slice(PESEL_DAY_START, PESEL_DAY_END), RADIX);

  const range = PESEL_MONTH_RANGES.find(
    ([min, max]) => monthRaw >= min && monthRaw <= max,
  );

  if (range === undefined) {
    return false;
  }

  const month = monthRaw - range[2];
  return month >= MIN_MONTH && month <= MAX_MONTH && day >= MIN_DAY && day <= MAX_DAY;
};
