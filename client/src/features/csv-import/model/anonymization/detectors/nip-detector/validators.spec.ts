import { describe, expect, it } from 'vitest';

import { hasNipContext, validateNip } from './validators';

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

describe('hasNipContext', () => {
  it('returns true when "NIP:" precedes the position', () => {
    const text = 'Firma NIP: 1234563218';
    expect(hasNipContext(text, 11)).toBe(true);
  });

  it('returns true when "nr nip" precedes the position', () => {
    const text = 'Nr NIP 1234563218';
    expect(hasNipContext(text, 7)).toBe(true);
  });

  it('returns false when no context keyword is present', () => {
    const text = 'Identyfikator 1234563218';
    expect(hasNipContext(text, 14)).toBe(false);
  });

  it('returns false when context keyword is too far away', () => {
    const text = 'NIP firmy jest bardzo daleko od numeru          1234563218';
    expect(hasNipContext(text, 48)).toBe(false);
  });
});
