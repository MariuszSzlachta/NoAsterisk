import { describe, expect, it } from 'vitest';

import { isDomainField } from './is-domain-field';

describe('isDomainField', () => {
  it.each([
    'date', 'title', 'amount', 'currency', 'balance',
    'debit', 'credit', 'category', 'source', 'recipient',
    'counterpart', 'reference',
  ])('returns true for valid field "%s"', (field) => {
    expect(isDomainField(field)).toBe(true);
  });

  it.each(['foo', 'bar', '', 'Date', 'AMOUNT', 'date '])('returns false for invalid value "%s"', (value) => {
    expect(isDomainField(value)).toBe(false);
  });
});
