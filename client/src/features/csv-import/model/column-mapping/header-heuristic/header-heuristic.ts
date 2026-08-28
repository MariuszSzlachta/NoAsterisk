import type { DomainField } from '#features/csv-import/model/column-mapping/domain-field';

export interface HeaderHeuristic {
  readonly normalized: string;
  readonly field: DomainField;
  readonly source: 'builtin' | 'user';
}
