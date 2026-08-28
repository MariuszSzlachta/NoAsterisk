import { ALL_MONTH_LOCALES } from '#features/csv-import/model/parsing/date-parser/locales/month-locales/constants/all-month-locales';

export const resolveMonth = (monthStr: string): number | null => {
  const lower = monthStr.toLowerCase();
  return ALL_MONTH_LOCALES.reduce<number | null>(
    (found, locale) => found ?? locale.months[lower] ?? null,
    null,
  );
};
