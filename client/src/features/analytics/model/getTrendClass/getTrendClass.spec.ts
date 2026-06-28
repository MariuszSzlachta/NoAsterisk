import { describe, expect, it } from 'vitest';

import { getTrendClass } from './getTrendClass';

describe('getTrendClass', () => {
  it.each([
    ['up', false, 'text-income'],
    ['down', false, 'text-expense'],
    ['neutral', false, 'text-muted-foreground'],
    ['up', true, 'text-expense'],
    ['down', true, 'text-income'],
    ['neutral', true, 'text-muted-foreground'],
  ] as const)('returns correct class for trend=%s inverted=%s', (trend, inverted, expected) => {
    expect(getTrendClass(trend, inverted)).toBe(expected);
  });
});
