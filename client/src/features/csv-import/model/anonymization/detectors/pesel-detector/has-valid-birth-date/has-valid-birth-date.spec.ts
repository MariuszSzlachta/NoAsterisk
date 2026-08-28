import { describe, expect, it } from 'vitest';

import { hasValidBirthDate } from './has-valid-birth-date';

describe('hasValidBirthDate', () => {
  it('returns true for 1900s month (01-12)', () => {
    // 44-05-14 → May 14, 1944
    expect(hasValidBirthDate('44051401458')).toBe(true);
  });

  it('returns true for 2000s month (21-32)', () => {
    // 00-21-15 → January 15, 2000 (monthRaw 21 → month 1)
    expect(hasValidBirthDate('00211500000')).toBe(true);
  });

  it('returns true for month 32 (December in 2000s)', () => {
    // monthRaw 32 → month 12
    expect(hasValidBirthDate('00321500000')).toBe(true);
  });

  it('returns false for invalid month 99', () => {
    expect(hasValidBirthDate('12995678903')).toBe(false);
  });

  it('returns false for month 13 (out of 1900s range, below 2000s range)', () => {
    expect(hasValidBirthDate('00130100000')).toBe(false);
  });

  it('returns false for month 00', () => {
    expect(hasValidBirthDate('00000100000')).toBe(false);
  });
});
