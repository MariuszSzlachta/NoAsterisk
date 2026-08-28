import type { DateFormat } from '#features/csv-import/model/parsing/types/date-format';

export interface ParseableDateFormat {
  readonly format: DateFormat;
  readonly regex: RegExp;
  readonly parse: (
    m: RegExpMatchArray,
  ) => { year: number; month: number; day: number } | null;
}
