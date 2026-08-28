import { describe, expect, it } from 'vitest';

import { splitRespectingQuotes } from '#features/csv-import/model/parsing/shared/split-respecting-quotes';

describe('splitRespectingQuotes', () => {
  it('splits simple comma-separated line', () => {
    expect(splitRespectingQuotes('a,b,c', ',')).toEqual(['a', 'b', 'c']);
  });

  it('splits semicolon-separated line', () => {
    expect(splitRespectingQuotes('a;b;c', ';')).toEqual(['a', 'b', 'c']);
  });

  it('preserves content inside quotes containing separator', () => {
    expect(splitRespectingQuotes('"a,b",c,d', ',')).toEqual([
      '"a,b"',
      'c',
      'd',
    ]);
  });

  it('handles multiple quoted fields', () => {
    expect(splitRespectingQuotes('"a;b";"c;d";e', ';')).toEqual([
      '"a;b"',
      '"c;d"',
      'e',
    ]);
  });

  it('handles empty fields', () => {
    expect(splitRespectingQuotes('a,,c', ',')).toEqual(['a', '', 'c']);
  });

  it('handles trailing separator', () => {
    expect(splitRespectingQuotes('a,b,', ',')).toEqual(['a', 'b', '']);
  });

  it('handles empty string', () => {
    expect(splitRespectingQuotes('', ',')).toEqual(['']);
  });

  it('handles single field', () => {
    expect(splitRespectingQuotes('abc', ',')).toEqual(['abc']);
  });

  it('handles nested quotes', () => {
    expect(splitRespectingQuotes('"a""b",c', ',')).toEqual(['"a""b"', 'c']);
  });
});
