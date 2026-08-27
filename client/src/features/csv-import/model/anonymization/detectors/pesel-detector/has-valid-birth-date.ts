/**
 * Validate that PESEL encodes a plausible birth date.
 * Month encoding: 01-12 (1900s), 21-32 (2000s), 41-52 (2100s).
 */
export const hasValidBirthDate = (digits: string): boolean => {
  const monthRaw = parseInt(digits.slice(2, 4), 10);
  const day = parseInt(digits.slice(4, 6), 10);

  const MONTH_RANGES: readonly (readonly [number, number, number])[] = [
    [1, 12, 0],
    [21, 32, 20],
    [41, 52, 40],
  ];

  const range = MONTH_RANGES.find(
    ([min, max]) => monthRaw >= min && monthRaw <= max,
  );

  if (range === undefined) {
    return false;
  }

  const month = monthRaw - range[2];
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
};
