import { describe, expect, it } from 'vitest';

import { validateLuhn } from './validate-luhn';

describe('validateLuhn', () => {
  describe('valid card numbers', () => {
    it.each([
      ['4532015112345670', 'Visa with valid Luhn'],
      ['4111111111111111', 'Visa test card'],
    ])('returns true for %s (%s)', (digits) => {
      expect(validateLuhn(digits)).toBe(true);
    });
  });

  describe('invalid card numbers', () => {
    it.each([
      ['4111111111111112', 'wrong check digit'],
      ['1234567890123456', 'arbitrary digits'],
    ])('returns false for %s (%s)', (digits) => {
      expect(validateLuhn(digits)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('returns false for too short input (<13 digits)', () => {
      expect(validateLuhn('411111111111')).toBe(false);
    });

    it('returns false for too long input (>19 digits)', () => {
      expect(validateLuhn('41111111111111111111')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(validateLuhn('')).toBe(false);
    });

    it('accepts 13-digit number (minimum length)', () => {
      expect(validateLuhn('4000000000006')).toBe(true);
    });

    it('accepts 19-digit number (maximum length)', () => {
      expect(validateLuhn('6304000000000000042')).toBe(true);
    });
  });
});
