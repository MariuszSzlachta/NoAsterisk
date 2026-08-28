import { describe, expect, it } from 'vitest';

import { EMPTY_ACCUMULATOR_STATE } from '#features/csv-import/model/column-mapping/auto-detect/empty-accumulator-state';

describe('EMPTY_ACCUMULATOR_STATE', () => {
  it('has empty mapping', () => {
    expect(EMPTY_ACCUMULATOR_STATE.mapping).toEqual({});
  });

  it('has empty usedFields set', () => {
    expect(EMPTY_ACCUMULATOR_STATE.usedFields.size).toBe(0);
  });
});
