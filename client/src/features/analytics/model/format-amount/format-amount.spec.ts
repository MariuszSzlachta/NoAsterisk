import { describe, expect, it } from 'vitest';

import { formatAnalyticsAmount } from './format-amount';

describe('formatAnalyticsAmount', () => {
  it('formats zero', () => {
    expect(formatAnalyticsAmount(0)).toBe('0,00 zł');
  });

  it('formats positive integer', () => {
    expect(formatAnalyticsAmount(1234)).toMatch(/1[\s.]?234,00 zł/);
  });

  it('formats negative as absolute value', () => {
    expect(formatAnalyticsAmount(-500)).toBe('500,00 zł');
  });

  it('formats with 2 decimal places', () => {
    expect(formatAnalyticsAmount(99.9)).toBe('99,90 zł');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatAnalyticsAmount(100.999)).toBe('101,00 zł');
  });

  it('formats large numbers with thousands separator', () => {
    const result = formatAnalyticsAmount(1234567.89);
    expect(result).toContain('zł');
    expect(result).toContain('234');
    expect(result).toContain('567');
  });
});
