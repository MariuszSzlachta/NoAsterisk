import { describe, expect, it } from 'vitest';

import {
  hasPeselContext,
  hasValidBirthDate,
  validatePesel,
} from './validators';

describe('validatePesel', () => {
  it('returns true for valid PESEL 44051401458', () => {
    expect(validatePesel('44051401458')).toBe(true);
  });

  it('returns false for invalid checksum 44051401450', () => {
    expect(validatePesel('44051401450')).toBe(false);
  });

  it('returns false for wrong length (10 digits)', () => {
    expect(validatePesel('4405140145')).toBe(false);
  });

  it('returns false for wrong length (12 digits)', () => {
    expect(validatePesel('440514014580')).toBe(false);
  });
});

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

describe('hasPeselContext', () => {
  it('returns true when "PESEL:" precedes the position', () => {
    const text = 'Nr PESEL: 44051401458';
    expect(hasPeselContext(text, 10)).toBe(true);
  });

  it('returns true when "numer pesel" precedes the position', () => {
    const text = 'Numer PESEL 44051401458';
    expect(hasPeselContext(text, 12)).toBe(true);
  });

  it('returns false when no context keyword is present', () => {
    const text = 'Identyfikator 44051401458';
    expect(hasPeselContext(text, 14)).toBe(false);
  });
});
