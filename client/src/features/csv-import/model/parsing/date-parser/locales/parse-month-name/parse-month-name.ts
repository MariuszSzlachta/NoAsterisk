import { resolveMonth } from '#features/csv-import/model/parsing/date-parser/locales/month-locales';

export const parseMonthName = (
  m: RegExpMatchArray,
): { year: number; month: number; day: number } | null => {
  const [, dayStr, monthStr, yearStr] = m;
  if (dayStr === undefined || monthStr === undefined || yearStr === undefined) {
    return null;
  }
  const month = resolveMonth(monthStr);
  if (month === null) {
    return null;
  }
  return { year: +yearStr, month, day: +dayStr };
};
