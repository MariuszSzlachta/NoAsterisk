import type { AmountLocale } from '#features/csv-import/model/parsing/types/amount-locale';
import type { DateFormat } from '#features/csv-import/model/parsing/types/date-format';
import type { ColumnMapping } from '#features/csv-import/model/column-mapping/column-mapping-type';

export interface BankProfile {
  readonly id: string;
  readonly bankName: string;
  readonly headerSignatures: readonly (readonly string[])[];
  readonly defaultMapping: ColumnMapping;
  readonly dateFormat: DateFormat;
  readonly amountLocale: AmountLocale;
  readonly encoding?: string;
  readonly separator?: string;
  readonly skipRows?: number;
}
