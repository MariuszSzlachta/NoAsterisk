import { describe, expect, it } from 'vitest';

import { validateNip } from './validate-nip';

describe('validateNip', () => {
  it('returns true for valid NIP 1234563218', () => {
    expect(validateNip('1234563218')).toBe(true);
  });

  it('returns false for invalid checksum 1234563219', () => {
    expect(validateNip('1234563219')).toBe(false);
  });

  it('returns false for wrong length (9 digits)', () => {
    expect(validateNip('123456321')).toBe(false);
  });

  it('returns false for wrong length (11 digits)', () => {
    expect(validateNip('12345632180')).toBe(false);
  });

  it('returns false when checksum mod 11 equals 10', () => {
    // '1000000160': weighted sum = 54, 54 % 11 = 10 → always invalid per spec
    expect(validateNip('1000000160')).toBe(false);
  });
});
