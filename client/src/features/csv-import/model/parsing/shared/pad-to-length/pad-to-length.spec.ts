import { describe, expect, it } from 'vitest';

import { padToLength } from '#features/csv-import/model/parsing/shared/pad-to-length';

describe('padToLength', () => {
  it('pads shorter array with empty strings', () => {
    expect(padToLength(['a', 'b'], 4)).toEqual(['a', 'b', '', '']);
  });

  it('pads with custom fill value', () => {
    expect(padToLength(['a'], 3, 'x')).toEqual(['a', 'x', 'x']);
  });

  it('returns same array when already at target length', () => {
    const arr = ['a', 'b', 'c'];
    expect(padToLength(arr, 3)).toEqual(arr);
  });

  it('returns same array when longer than target', () => {
    expect(padToLength(['a', 'b', 'c'], 2)).toEqual(['a', 'b', 'c']);
  });

  it('handles empty array', () => {
    expect(padToLength([], 2)).toEqual(['', '']);
  });

  it('handles zero target length', () => {
    expect(padToLength([], 0)).toEqual([]);
  });
});
