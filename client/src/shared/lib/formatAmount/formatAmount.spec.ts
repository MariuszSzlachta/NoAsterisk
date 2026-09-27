import { describe, expect, it } from 'vitest';

import { formatAmount } from './formatAmount';

describe('formatAmount', () => {
  it('formats amounts with two decimal places using the Polish locale', () => {
    expect(formatAmount(12345.5).replace(/\s/g, ' ')).toBe('12 345,50');
  });

  it('rounds to two decimal places and preserves the sign', () => {
    expect(formatAmount(-12.345)).toBe('-12,35');
  });
});
