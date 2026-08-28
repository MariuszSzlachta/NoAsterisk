import { describe, expect, it } from 'vitest';

import { stripSurroundingQuotes } from '#features/csv-import/model/column-mapping/normalize-header/strip-surrounding-quotes';

describe('stripSurroundingQuotes', () => {
  it('removes double quotes', () => {
    expect(stripSurroundingQuotes('"Kwota"')).toBe('Kwota');
  });

  it('removes single quotes', () => {
    expect(stripSurroundingQuotes("'Saldo'")).toBe('Saldo');
  });

  it('returns unchanged when no quotes', () => {
    expect(stripSurroundingQuotes('Kwota')).toBe('Kwota');
  });
});
