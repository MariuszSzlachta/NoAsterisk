import { describe, expect, it } from 'vitest';

import { validateNationalId } from './validate-national-id';

describe('validateNationalId', () => {
  it('returns true for valid checksum (ABS 847291)', () => {
    expect(validateNationalId('ABS', '847291')).toBe(true);
  });

  it('returns false for invalid checksum', () => {
    expect(validateNationalId('XYZ', '123456')).toBe(false);
  });

  it('returns false when letters length is not 3', () => {
    expect(validateNationalId('AB', '847291')).toBe(false);
    expect(validateNationalId('ABCD', '847291')).toBe(false);
  });

  it('returns false when digits length is not 6', () => {
    expect(validateNationalId('ABS', '12345')).toBe(false);
    expect(validateNationalId('ABS', '1234567')).toBe(false);
  });

  it('returns false for empty strings', () => {
    expect(validateNationalId('', '')).toBe(false);
  });

  it('returns true for AAA 000000 (valid checksum — sum=110, 110%10=0, check digit=0)', () => {
    expect(validateNationalId('AAA', '000000')).toBe(true);
  });

  it('returns false for ABC 111111 (invalid checksum)', () => {
    expect(validateNationalId('ABC', '111111')).toBe(false);
  });
});
