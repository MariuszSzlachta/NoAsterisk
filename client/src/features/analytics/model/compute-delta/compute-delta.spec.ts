import { describe, expect, it } from 'vitest';

import { computeDelta, computeTrend } from './compute-delta';

describe('computeDelta', () => {
  it.each([
    [120, 100, '+20,0%'],
    [80, 100, '-20,0%'],
    [0, 0, '0,0%'],
    [10, 0, '+∞'],
    [-80, -100, '+20,0%'],
  ])(
    'formats the change relative to the previous value',
    (current, previous, expected) => {
      expect(computeDelta(current, previous)).toBe(expected);
    },
  );
});

describe('computeTrend', () => {
  it.each([
    [2, 1, 'up'],
    [1, 2, 'down'],
    [1, 1, 'neutral'],
  ] as const)(
    'compares current and previous values',
    (current, previous, expected) => {
      expect(computeTrend(current, previous)).toBe(expected);
    },
  );
});
