import { describe, expect, it } from 'vitest';

import { REQUIRED_FIELDS } from '#features/csv-import/model/column-mapping/validators/required-fields';

describe('REQUIRED_FIELDS', () => {
  it('maps DATE to "date"', () => {
    expect(REQUIRED_FIELDS.DATE).toBe('date');
  });

  it('maps TITLE to "title"', () => {
    expect(REQUIRED_FIELDS.TITLE).toBe('title');
  });

  it('maps AMOUNT to "amount"', () => {
    expect(REQUIRED_FIELDS.AMOUNT).toBe('amount');
  });

  it('maps DEBIT to "debit"', () => {
    expect(REQUIRED_FIELDS.DEBIT).toBe('debit');
  });

  it('maps CREDIT to "credit"', () => {
    expect(REQUIRED_FIELDS.CREDIT).toBe('credit');
  });
});
