import { describe, expect, it } from 'vitest';

import { validateBarePl } from './validate-bare-pl';
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

describe('validateBarePl', () => {
  describe('valid bare Polish accounts', () => {
    it('returns true for valid 26-digit Polish account', () => {
      expect(validateBarePl('61109010140000071219812874')).toBe(true);
    });

    it('returns true with spaces in input', () => {
      expect(validateBarePl('61 1090 1014 0000 0712 1981 2874')).toBe(true);
    });
  });

  describe('invalid bare Polish accounts', () => {
    it('returns false for wrong checksum', () => {
      expect(validateBarePl('61109010140000071219812875')).toBe(false);
    });

    it('returns false for wrong length (25 digits)', () => {
      expect(validateBarePl('6110901014000007121981287')).toBe(false);
    });

    it('returns false for wrong length (27 digits)', () => {
      expect(validateBarePl('611090101400000712198128741')).toBe(false);
    });
  });
});
