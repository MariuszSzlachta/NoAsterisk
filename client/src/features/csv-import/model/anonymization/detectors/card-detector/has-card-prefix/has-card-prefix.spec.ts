import { describe, expect, it } from 'vitest';

import { hasCardPrefix } from './has-card-prefix';

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
