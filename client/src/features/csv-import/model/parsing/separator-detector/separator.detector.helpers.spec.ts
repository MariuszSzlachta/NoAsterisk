import { describe, expect, it } from 'vitest';

import {
  countUnquoted,
  findMode,
  longestStreak,
  scoreSeparator,
} from './index';

describe('countUnquoted', () => {
  it('counts simple unquoted occurrences', () => {
    expect(countUnquoted('a;b;c', ';')).toBe(2);
  });

  it('counts commas in simple line', () => {
    expect(countUnquoted('a,b,c,d', ',')).toBe(3);
  });

  it('returns 0 when character not present', () => {
    expect(countUnquoted('abc', ';')).toBe(0);
  });

  it('ignores separators inside double quotes', () => {
    expect(countUnquoted('"a;b";c;d', ';')).toBe(2);
  });

  it('handles nested quoted regions', () => {
    expect(countUnquoted('"a;b;c";d;"e;f"', ';')).toBe(2);
  });

  it('returns 0 for empty line', () => {
    expect(countUnquoted('', ';')).toBe(0);
  });

  it('handles line with only separators', () => {
    expect(countUnquoted(';;;', ';')).toBe(3);
  });

  it('handles tab separator', () => {
    expect(countUnquoted('a\tb\tc', '\t')).toBe(2);
  });
});

describe('findMode', () => {
  it('finds single mode', () => {
    const result = findMode([3, 3, 3, 5, 5]);
    expect(result).toEqual({ count: 3, frequency: 3 });
  });

  it('returns higher count on tie', () => {
    const result = findMode([2, 2, 5, 5]);
    expect(result).toEqual({ count: 5, frequency: 2 });
  });

  it('handles single value', () => {
    const result = findMode([7]);
    expect(result).toEqual({ count: 7, frequency: 1 });
  });

  it('handles all identical values', () => {
    const result = findMode([4, 4, 4, 4]);
    expect(result).toEqual({ count: 4, frequency: 4 });
  });

  it('handles diverse values with clear mode', () => {
    const result = findMode([1, 2, 3, 3, 3, 4, 5]);
    expect(result).toEqual({ count: 3, frequency: 3 });
  });
});

describe('longestStreak', () => {
  it('finds streak of exact mode matches', () => {
    expect(longestStreak([3, 3, 3, 0, 3], 3)).toBe(3);
  });

  it('allows count = modeCount - 1 (tolerance)', () => {
    expect(longestStreak([3, 2, 3, 0, 3], 3)).toBe(3);
  });

  it('returns 0 when no counts match', () => {
    expect(longestStreak([0, 0, 0], 3)).toBe(0);
  });

  it('handles single element matching', () => {
    expect(longestStreak([5], 5)).toBe(1);
  });

  it('handles single element not matching', () => {
    expect(longestStreak([0], 5)).toBe(0);
  });

  it('resets streak on zero', () => {
    expect(longestStreak([3, 3, 0, 3, 3, 3], 3)).toBe(3);
  });

  it('handles empty array', () => {
    expect(longestStreak([], 3)).toBe(0);
  });
});

describe('scoreSeparator', () => {
  it('returns positive score for consistent separator', () => {
    const lines = ['a;b;c', 'd;e;f', 'g;h;i'];
    expect(scoreSeparator(lines, ';')).toBeGreaterThan(0);
  });

  it('returns 0 when separator not found', () => {
    const lines = ['abc', 'def', 'ghi'];
    expect(scoreSeparator(lines, ';')).toBe(0);
  });

  it('scores semicolons higher than commas for PL CSV', () => {
    const lines = [
      'Data;Opis;Kwota;Waluta',
      '2026-01-01;BIEDRONKA;-87,43;PLN',
      '2026-01-02;BOLT;-34,20;PLN',
    ];
    const semicolonScore = scoreSeparator(lines, ';');
    const commaScore = scoreSeparator(lines, ',');
    expect(semicolonScore).toBeGreaterThan(commaScore);
  });

  it('handles single line', () => {
    const lines = ['a;b;c'];
    expect(scoreSeparator(lines, ';')).toBeGreaterThan(0);
  });
});
