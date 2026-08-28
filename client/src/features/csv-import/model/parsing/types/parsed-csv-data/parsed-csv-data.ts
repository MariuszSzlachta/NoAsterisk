import type { CsvRow } from '#features/csv-import/model/parsing/types/csv-row';

export interface ParsedCsvData {
  readonly headers: readonly string[];
  readonly rows: readonly CsvRow[];
  readonly fileName: string;
  readonly encoding: string;
  readonly separator: string;
  readonly rowCount: number;
}
