import type { DateFormat } from '#features/csv-import/model/parsing/types/date-format';

export interface MonthNameFormatDef {
  readonly format: DateFormat;
  readonly regex: RegExp;
  readonly parse: (
    match: RegExpMatchArray,
  ) => { year: number; month: number; day: number } | null;
}
