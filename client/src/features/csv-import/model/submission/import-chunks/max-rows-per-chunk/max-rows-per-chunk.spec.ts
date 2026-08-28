import { describe, expect, it } from 'vitest';

import { MAX_ROWS_PER_CHUNK } from '#features/csv-import/model/submission/import-chunks/max-rows-per-chunk';

describe('MAX_ROWS_PER_CHUNK', () => {
  it('equals 200', () => {
    expect(MAX_ROWS_PER_CHUNK).toBe(200);
  });
});
