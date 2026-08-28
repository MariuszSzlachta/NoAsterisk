import { describe, expect, it } from 'vitest';

import { ALL_DOMAIN_FIELDS } from '#features/csv-import/model/column-mapping/validators/all-domain-fields';
import { VALID_DOMAIN_FIELDS } from '#features/csv-import/model/column-mapping/validators/valid-domain-fields';

describe('VALID_DOMAIN_FIELDS', () => {
  it('is a Set containing all domain fields', () => {
    expect(VALID_DOMAIN_FIELDS.size).toBe(ALL_DOMAIN_FIELDS.length);
  });

  it.each([...ALL_DOMAIN_FIELDS])('contains "%s"', (field) => {
    expect(VALID_DOMAIN_FIELDS.has(field)).toBe(true);
  });

  it('does not contain unknown values', () => {
    expect(VALID_DOMAIN_FIELDS.has('unknown')).toBe(false);
    expect(VALID_DOMAIN_FIELDS.has('')).toBe(false);
  });
});
