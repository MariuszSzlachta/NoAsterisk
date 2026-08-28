import type { DomainField } from '#features/csv-import/model/column-mapping/domain-field';

export const firstCol = (
  fieldToColumns: Partial<Record<DomainField, readonly string[]>>,
  field: DomainField,
): string | undefined => fieldToColumns[field]?.[0];
