import type { DateFormat } from '#features/csv-import/model/parsing/types/date-format';
import type { AmountLocale } from '#features/csv-import/model/parsing/types/amount-locale';

export interface ParserConfig {
  readonly encoding: string;
  readonly separator: string;
  readonly dateFormat: DateFormat;
  readonly amountLocale: AmountLocale;
  readonly skipRows: number;
}
