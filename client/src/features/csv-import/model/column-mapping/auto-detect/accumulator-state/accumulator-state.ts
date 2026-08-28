import type { ColumnMapping } from '#features/csv-import/model/column-mapping/column-mapping-type';
import type { DomainField } from '#features/csv-import/model/column-mapping/domain-field';

export interface AccumulatorState {
  readonly mapping: ColumnMapping;
  readonly usedFields: ReadonlySet<DomainField>;
}
