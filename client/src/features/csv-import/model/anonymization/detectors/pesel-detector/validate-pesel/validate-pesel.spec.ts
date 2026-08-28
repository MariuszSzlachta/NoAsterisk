import { describe, expect, it } from 'vitest';

import { validatePesel } from './validate-pesel';

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
