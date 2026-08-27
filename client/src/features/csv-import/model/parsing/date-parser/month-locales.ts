import type { MonthLocale } from '#features/csv-import/model/parsing/types';

const PL_LOCALE: MonthLocale = {
  id: 'pl',
  months: {
    sty: 1, lut: 2, mar: 3, kwi: 4, maj: 5, cze: 6,
    lip: 7, sie: 8, wrz: 9, paź: 10, paz: 10, lis: 11, gru: 12,
    styczeń: 1, styczen: 1, luty: 2, marzec: 3, kwiecień: 4, kwiecien: 4,
    czerwiec: 6, lipiec: 7, sierpień: 8, sierpien: 8,
    wrzesień: 9, wrzesien: 9, październik: 10, pazdziernik: 10,
    listopad: 11, grudzień: 12, grudzien: 12,
  },
};

const EN_LOCALE: MonthLocale = {
  id: 'en',
  months: {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    january: 1, february: 2, march: 3, april: 4,
    june: 6, july: 7, august: 8, september: 9,
    october: 10, november: 11, december: 12,
  },
};

const DE_LOCALE: MonthLocale = {
  id: 'de',
  months: {
    jan: 1, feb: 2, mär: 3, mar: 3, apr: 4, mai: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, okt: 10, nov: 11, dez: 12,
    januar: 1, februar: 2, märz: 3, marz: 3, april: 4,
    juni: 6, juli: 7, august: 8, september: 9,
    oktober: 10, november: 11, dezember: 12,
  },
};

/** Lookup order: PL first for Polish bank CSVs. Add new locales here. */
const MONTH_LOCALES: readonly MonthLocale[] = [PL_LOCALE, EN_LOCALE, DE_LOCALE];

export const resolveMonth = (monthStr: string): number | null => {
  const lower = monthStr.toLowerCase();
  return MONTH_LOCALES.reduce<number | null>(
    (found, locale) => found ?? (locale.months[lower] ?? null),
    null,
  );
};
