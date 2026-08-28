import { describe, expect, it } from 'vitest';

import { sliceIntoChunks } from '#features/csv-import/model/submission/import-chunks/slice-into-chunks';

describe('sliceIntoChunks', () => {
  it('returns single chunk when items fit', () => {
    const result = sliceIntoChunks([1, 2, 3], 5);
    expect(result).toEqual([[1, 2, 3]]);
  });

  it('splits items into equal chunks', () => {
    const result = sliceIntoChunks([1, 2, 3, 4], 2);
    expect(result).toEqual([[1, 2], [3, 4]]);
  });

  it('handles remainder in last chunk', () => {
    const result = sliceIntoChunks([1, 2, 3, 4, 5], 2);
    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns empty array for empty input', () => {
    const result = sliceIntoChunks([], 3);
    expect(result).toEqual([]);
  });

  it('handles chunk size equal to array length', () => {
    const result = sliceIntoChunks([1, 2, 3], 3);
    expect(result).toEqual([[1, 2, 3]]);
  });

  it('handles chunk size of 1', () => {
    const result = sliceIntoChunks([1, 2, 3], 1);
    expect(result).toEqual([[1], [2], [3]]);
  });
});
