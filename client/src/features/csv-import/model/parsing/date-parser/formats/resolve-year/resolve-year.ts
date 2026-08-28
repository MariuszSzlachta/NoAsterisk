export const TWO_DIGIT_YEAR_THRESHOLD = 100;
export const TWO_DIGIT_YEAR_BASE = 2000;

export const resolveYear = (yearStr: string): number | null => {
  const num = parseInt(yearStr, 10);
  if (isNaN(num)) {
    return null;
  }
  return num < TWO_DIGIT_YEAR_THRESHOLD ? TWO_DIGIT_YEAR_BASE + num : num;
};
