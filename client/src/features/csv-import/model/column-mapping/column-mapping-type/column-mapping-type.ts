import type { DomainField } from '#features/csv-import/model/column-mapping/domain-field';

export type ColumnMapping = Partial<Record<string, DomainField>>;
