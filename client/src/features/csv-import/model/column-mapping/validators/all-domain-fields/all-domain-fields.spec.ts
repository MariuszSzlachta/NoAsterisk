import { describe, expect, it } from 'vitest';

import { ALL_DOMAIN_FIELDS } from '#features/csv-import/model/column-mapping/validators/all-domain-fields';

describe('ALL_DOMAIN_FIELDS', () => {
  it('contains exactly 12 fields', () => {
    expect(ALL_DOMAIN_FIELDS).toHaveLength(12);
  });

  it('contains all expected domain fields', () => {
    expect(ALL_DOMAIN_FIELDS).toContain('date');
    expect(ALL_DOMAIN_FIELDS).toContain('title');
    expect(ALL_DOMAIN_FIELDS).toContain('amount');
    expect(ALL_DOMAIN_FIELDS).toContain('currency');
    expect(ALL_DOMAIN_FIELDS).toContain('balance');
    expect(ALL_DOMAIN_FIELDS).toContain('debit');
    expect(ALL_DOMAIN_FIELDS).toContain('credit');
    expect(ALL_DOMAIN_FIELDS).toContain('category');
    expect(ALL_DOMAIN_FIELDS).toContain('source');
    expect(ALL_DOMAIN_FIELDS).toContain('recipient');
    expect(ALL_DOMAIN_FIELDS).toContain('counterpart');
    expect(ALL_DOMAIN_FIELDS).toContain('reference');
  });

  it('has no duplicates', () => {
    const unique = new Set(ALL_DOMAIN_FIELDS);
    expect(unique.size).toBe(ALL_DOMAIN_FIELDS.length);
  });
});
