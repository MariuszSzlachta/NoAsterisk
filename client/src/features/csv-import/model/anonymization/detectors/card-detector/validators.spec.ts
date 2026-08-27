import { describe, expect, it } from 'vitest';

import { hasCardPrefix } from './has-card-prefix';
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

describe('hasCardPrefix', () => {
  describe('Visa', () => {
    it('returns true for prefix starting with 4', () => {
      expect(hasCardPrefix('4532015112345678')).toBe(true);
    });
  });

  describe('Mastercard', () => {
    it.each(['51', '52', '53', '54', '55'])(
      'returns true for prefix %s',
      (prefix) => {
        expect(hasCardPrefix(`${prefix}00000000000000`)).toBe(true);
      },
    );

    it.each(['2221', '2500', '2720'])(
      'returns true for prefix %s (2-series)',
      (prefix) => {
        expect(hasCardPrefix(`${prefix}000000000000`)).toBe(true);
      },
    );
  });

  describe('Maestro', () => {
    it('returns true for prefix starting with 6', () => {
      expect(hasCardPrefix('6011000000000000')).toBe(true);
    });

    it('returns true for prefix 50', () => {
      expect(hasCardPrefix('5000000000000000')).toBe(true);
    });
  });

  describe('Amex', () => {
    it.each(['34', '37'])('returns true for prefix %s', (prefix) => {
      expect(hasCardPrefix(`${prefix}0000000000000`)).toBe(true);
    });
  });

  describe('invalid prefixes', () => {
    it.each(['0', '1', '9'])(
      'returns false for prefix starting with %s',
      (prefix) => {
        expect(hasCardPrefix(`${prefix}000000000000000`)).toBe(false);
      },
    );
  });
});
