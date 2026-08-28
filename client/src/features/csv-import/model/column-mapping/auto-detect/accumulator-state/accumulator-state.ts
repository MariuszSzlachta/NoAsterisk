import type { ColumnMapping, DomainField } from '#features/csv-import/model/column-mapping/types';

export interface AccumulatorState {
  readonly mapping: ColumnMapping;
  readonly usedFields: ReadonlySet<DomainField>;
}
