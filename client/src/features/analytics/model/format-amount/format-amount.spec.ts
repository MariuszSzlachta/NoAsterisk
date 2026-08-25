import { describe, expect, it } from 'vitest';

import { formatAbsoluteAmount, formatAnalyticsAmount, formatSignedAmount } from './format-amount';

describe('formatAbsoluteAmount', () => {
  it('formats zero', () => {
    expect(formatAbsoluteAmount(0)).toBe('0,00 zł');
  });

  it('formats positive integer', () => {
    expect(formatAbsoluteAmount(1234)).toMatch(/1[\s.]?234,00 zł/);
  });

  it('formats negative as absolute value', () => {
    expect(formatAbsoluteAmount(-500)).toBe('500,00 zł');
  });

  it('formats with 2 decimal places', () => {
    expect(formatAbsoluteAmount(99.9)).toBe('99,90 zł');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatAbsoluteAmount(100.999)).toBe('101,00 zł');
  });

  it('formats large numbers with thousands separator', () => {
    const result = formatAbsoluteAmount(1234567.89);
    expect(result).toContain('zł');
    expect(result).toContain('234');
    expect(result).toContain('567');
  });
});

describe('formatSignedAmount', () => {
  it('formats zero', () => {
    expect(formatSignedAmount(0)).toBe('0,00 zł');
  });

  it('preserves positive value', () => {
    expect(formatSignedAmount(1234)).toMatch(/1[\s.]?234,00 zł/);
  });

  it('preserves negative sign', () => {
    const result = formatSignedAmount(-500);
    expect(result).toContain('500');
    expect(result).toContain('zł');
    expect(result).toMatch(/-500/);
  });

  it('formats with 2 decimal places', () => {
    expect(formatSignedAmount(99.9)).toBe('99,90 zł');
  });

  it('preserves negative sign for large numbers', () => {
    const result = formatSignedAmount(-8500);
    expect(result).toContain('zł');
    expect(result).toContain('500');
    expect(result).toMatch(/-/);
  });
});

describe('formatAnalyticsAmount (deprecated, backward compat)', () => {
  it('formats zero', () => {
    expect(formatAnalyticsAmount(0)).toBe('0,00 zł');
  });

  it('formats negative as absolute value', () => {
    expect(formatAnalyticsAmount(-500)).toBe('500,00 zł');
  });
});
