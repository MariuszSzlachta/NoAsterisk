import { describe, expect, it } from 'vitest';

import { toLower } from '#features/csv-import/model/column-mapping/normalize-header/to-lower';

describe('toLower', () => {
  it('lowercases', () => {
    expect(toLower('DATA OPERACJI')).toBe('data operacji');
  });
});
