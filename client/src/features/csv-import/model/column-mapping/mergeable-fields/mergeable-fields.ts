import type { DomainField } from '#features/csv-import/model/column-mapping/types';

export const MERGEABLE_FIELDS: ReadonlySet<DomainField> = new Set([
  'title',
  'source',
  'recipient',
  'counterpart',
]);
