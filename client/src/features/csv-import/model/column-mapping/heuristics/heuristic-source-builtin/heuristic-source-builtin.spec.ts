import { describe, expect, it } from 'vitest';

import { HEURISTIC_SOURCE_BUILTIN } from '#features/csv-import/model/column-mapping/heuristics/heuristic-source-builtin';

describe('HEURISTIC_SOURCE_BUILTIN', () => {
  it('equals "builtin"', () => {
    expect(HEURISTIC_SOURCE_BUILTIN).toBe('builtin');
  });
});
