import { PESEL_WEIGHTS } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants';

export const validatePesel = (digits: string): boolean => {
  if (digits.length !== 11) {
    return false;
  }

  const sum = PESEL_WEIGHTS.reduce(
    (acc, weight, i) => acc + parseInt(digits[i] ?? '0', 10) * weight,
    0,
  );

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(digits[10] ?? '-1', 10);
};
