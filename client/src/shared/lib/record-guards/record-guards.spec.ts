import { describe, expect, it } from 'vitest';

import { recordGuards } from './record-guards';

describe('recordGuards', () => {
  describe('hasString', () => {
    it('accepts only a string property', () => {
      expect(recordGuards.hasString({ name: '' }, 'name')).toBe(true);
      expect(recordGuards.hasString({ name: 1 }, 'name')).toBe(false);
      expect(recordGuards.hasString({}, 'name')).toBe(false);
    });
  });

  describe('hasFiniteNumber', () => {
    it('accepts finite numbers and rejects non-finite or non-number values', () => {
      expect(recordGuards.hasFiniteNumber({ amount: 0 }, 'amount')).toBe(true);
      expect(
        recordGuards.hasFiniteNumber({ amount: Number.NaN }, 'amount'),
      ).toBe(false);
      expect(
        recordGuards.hasFiniteNumber(
          { amount: Number.POSITIVE_INFINITY },
          'amount',
        ),
      ).toBe(false);
      expect(recordGuards.hasFiniteNumber({ amount: '1' }, 'amount')).toBe(
        false,
      );
    });
  });

  describe('isOptionalString', () => {
    it('accepts a missing or string property and rejects other values', () => {
      expect(recordGuards.isOptionalString({}, 'note')).toBe(true);
      expect(recordGuards.isOptionalString({ note: '' }, 'note')).toBe(true);
      expect(recordGuards.isOptionalString({ note: null }, 'note')).toBe(false);
    });
  });

  describe('isStringMap', () => {
    it('accepts records whose values are all strings', () => {
      expect(
        recordGuards.isStringMap({ debit: 'amount', date: 'bookingDate' }),
      ).toBe(true);
      expect(recordGuards.isStringMap({})).toBe(true);
    });

    it.each([{ debit: 1 }, ['amount'], null])(
      'rejects a value that is not a string map',
      (value) => {
        expect(recordGuards.isStringMap(value)).toBe(false);
      },
    );
  });
});
