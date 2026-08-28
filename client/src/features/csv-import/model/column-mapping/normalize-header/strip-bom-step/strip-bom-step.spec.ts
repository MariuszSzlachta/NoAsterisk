import { describe, expect, it } from 'vitest';

import { stripBom } from '#features/csv-import/model/column-mapping/normalize-header/strip-bom-step';

describe('stripBom', () => {
  it('removes BOM from start', () => {
    expect(stripBom('\uFEFFData')).toBe('Data');
  });

  it('returns unchanged when no BOM', () => {
    expect(stripBom('Data')).toBe('Data');
  });
});
