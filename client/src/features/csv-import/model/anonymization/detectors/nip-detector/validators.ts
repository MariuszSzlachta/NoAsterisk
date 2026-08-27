import { NIP_CONTEXT, NIP_WEIGHTS } from './constants';

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

export const hasNipContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - 20), start).toLowerCase();
  return NIP_CONTEXT.some((kw) => prefix.includes(kw));
};
