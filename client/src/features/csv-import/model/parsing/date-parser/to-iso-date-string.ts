export const toIsoDateString = (
  year: number,
  month: number,
  day: number,
): string =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
