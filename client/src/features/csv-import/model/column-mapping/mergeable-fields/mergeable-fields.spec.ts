import { describe, expect, it } from 'vitest';

import { MERGEABLE_FIELDS } from '#features/csv-import/model/column-mapping/mergeable-fields';

describe('MERGEABLE_FIELDS', () => {
  it('contains exactly 4 fields', () => {
    expect(MERGEABLE_FIELDS.size).toBe(4);
  });

  it.each(['title', 'source', 'recipient', 'counterpart'] as const)(
    'contains "%s"',
    (field) => {
      expect(MERGEABLE_FIELDS.has(field)).toBe(true);
    },
  );

  it.each(['date', 'amount', 'currency', 'balance', 'debit', 'credit'] as const)(
    'does not contain "%s"',
    (field) => {
      expect(MERGEABLE_FIELDS.has(field)).toBe(false);
    },
  );
});
