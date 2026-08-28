import { describe, expect, it } from 'vitest';

import { collapseWhitespace } from '#features/csv-import/model/column-mapping/normalize-header/collapse-whitespace';

describe('collapseWhitespace', () => {
  it('collapses multiple spaces', () => {
    expect(collapseWhitespace('Data   operacji')).toBe('Data operacji');
  });

  it('trims leading/trailing', () => {
    expect(collapseWhitespace('  Kwota  ')).toBe('Kwota');
  });

  it('handles tabs', () => {
    expect(collapseWhitespace('\tData\t')).toBe('Data');
  });
});
