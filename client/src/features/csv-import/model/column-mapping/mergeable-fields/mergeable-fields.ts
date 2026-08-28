import type { DomainField } from '#features/csv-import/model/column-mapping/domain-field';

export const MERGEABLE_FIELDS: ReadonlySet<DomainField> = new Set([
  'title',
  'source',
  'recipient',
  'counterpart',
]);
