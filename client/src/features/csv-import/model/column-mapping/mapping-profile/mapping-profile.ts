import type { ColumnMapping } from '#features/csv-import/model/column-mapping/column-mapping-type';

export interface MappingProfile {
  readonly id: string;
  readonly name: string;
  readonly mapping: ColumnMapping;
  readonly bankProfileId?: string;
  readonly createdAt: string;
}
