import { NIP_WEIGHTS } from './constants/nip-weights';

export const validateNip = (digits: string): boolean => {
  if (digits.length !== 10) {
    return false;
  }

  const sum = NIP_WEIGHTS.reduce(
    (acc, weight, i) => acc + parseInt(digits[i] ?? '0', 10) * weight,
    0,
  );

  const checkDigit = sum % 11;
  if (checkDigit === 10) {
    return false;
  }

  return checkDigit === parseInt(digits[9] ?? '-1', 10);
};
