import { PESEL_WEIGHTS } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/pesel-weights';
import { PESEL_LENGTH } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/pesel-length';
import { PESEL_CHECKSUM_MODULO } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/pesel-checksum-modulo';
import { PESEL_CHECK_DIGIT_INDEX } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/pesel-check-digit-index';
import { RADIX } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/radix';
import { DEFAULT_DIGIT } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/default-digit';
import { INVALID_CHECK } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/invalid-check';

export const validatePesel = (digits: string): boolean => {
  if (digits.length !== PESEL_LENGTH) {
    return false;
  }

  const sum = PESEL_WEIGHTS.reduce(
    (acc, weight, i) => acc + parseInt(digits[i] ?? DEFAULT_DIGIT, RADIX) * weight,
    0,
  );

  const checkDigit = (PESEL_CHECKSUM_MODULO - (sum % PESEL_CHECKSUM_MODULO)) % PESEL_CHECKSUM_MODULO;
  return checkDigit === parseInt(digits[PESEL_CHECK_DIGIT_INDEX] ?? INVALID_CHECK, RADIX);
};
