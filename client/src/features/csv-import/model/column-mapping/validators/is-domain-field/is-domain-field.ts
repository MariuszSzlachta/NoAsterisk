import type { DomainField } from '#features/csv-import/model/column-mapping/domain-field';
import { VALID_DOMAIN_FIELDS } from '#features/csv-import/model/column-mapping/validators/valid-domain-fields';

export const isDomainField = (value: string): value is DomainField =>
  VALID_DOMAIN_FIELDS.has(value);
