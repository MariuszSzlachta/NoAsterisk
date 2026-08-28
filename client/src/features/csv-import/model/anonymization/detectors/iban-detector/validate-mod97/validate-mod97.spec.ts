import { describe, expect, it } from 'vitest';

import { validateMod97 } from './validate-mod97';

describe('validateMod97', () => {
  describe('valid IBANs', () => {
    it('returns true for valid PL IBAN', () => {
      expect(validateMod97('PL61109010140000071219812874')).toBe(true);
    });

    it('returns true for valid PL IBAN with spaces', () => {
      expect(validateMod97('PL61 1090 1014 0000 0712 1981 2874')).toBe(true);
    });
  });

  describe('invalid IBANs', () => {
    it('returns false when last digit changed', () => {
      expect(validateMod97('PL61109010140000071219812875')).toBe(false);
    });

    it('returns false for arbitrary string with country prefix', () => {
      expect(validateMod97('PL00000000000000000000000000')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('returns false for too short input (<15 chars)', () => {
      expect(validateMod97('PL6110901014')).toBe(false);
    });

    it('returns false for too long input (>34 chars)', () => {
      expect(validateMod97('PL611090101400000712198128741234567')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(validateMod97('')).toBe(false);
    });
  });
});
