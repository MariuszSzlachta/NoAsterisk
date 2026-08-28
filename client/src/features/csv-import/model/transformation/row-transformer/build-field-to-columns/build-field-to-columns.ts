import { MERGEABLE_FIELDS } from '#features/csv-import/model/column-mapping/mergeable-fields';
import type { ColumnMapping } from '#features/csv-import/model/column-mapping/column-mapping-type';
import type { DomainField } from '#features/csv-import/model/column-mapping/domain-field';

export const buildFieldToColumns = (
  mapping: ColumnMapping,
): Partial<Record<DomainField, readonly string[]>> =>
  Object.entries(mapping).reduce<Partial<Record<DomainField, string[]>>>(
    (result, [col, field]) => {
      if (!field) {
        return result;
      }

      const existing = result[field] ?? [];

      if (MERGEABLE_FIELDS.has(field)) {
        return { ...result, [field]: [...existing, col] };
      }

      if (existing.length === 0) {
        return { ...result, [field]: [col] };
      }

      return result;
    },
    {},
  );
