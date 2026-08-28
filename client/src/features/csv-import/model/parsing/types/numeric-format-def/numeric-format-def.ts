import type { DateFormat } from '#features/csv-import/model/parsing/types/date-format';

export interface NumericFormatDef {
  readonly format: DateFormat;
  readonly regex: RegExp;
  readonly groups: {
    readonly year: number;
    readonly month: number;
    readonly day: number;
  };
  readonly yearResolver?: (s: string) => number | null;
}
