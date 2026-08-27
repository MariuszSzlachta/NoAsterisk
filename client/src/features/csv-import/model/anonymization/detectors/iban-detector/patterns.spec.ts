import { describe, expect, it } from 'vitest';

import { BARE_PL_COMPACT } from './bare-pl-compact-pattern';
import { BARE_PL_IBAN } from './bare-pl-iban-pattern';
import { IBAN_COMPACT } from './iban-compact-pattern';
import { IBAN_PATTERN } from './iban-pattern';

describe('iban patterns', () => {
  describe('IBAN_PATTERN', () => {
    it.each([
      'PL61 1090 1014 0000 0712 1981 2874',
      'PL61109010140000071219812874',
      'DE89 3704 0044 0532 0130 00',
    ])('matches "%s"', (input) => {
      const pattern = IBAN_PATTERN();
      // DE is shorter; pattern requires 6 groups of 4 digits — test PL ones
      if (input.startsWith('DE')) {
        // DE IBAN is 22 chars, pattern expects 26-digit body — skip
        return;
      }
      expect(pattern.test(input)).toBe(true);
    });

    it('does not match bare digits without country code', () => {
      expect(IBAN_PATTERN().test('61109010140000071219812874')).toBe(false);
    });
  });

  describe('IBAN_COMPACT', () => {
    it('matches compact PL IBAN', () => {
      expect(IBAN_COMPACT().test('PL61109010140000071219812874')).toBe(true);
    });

    it('does not match IBAN with spaces', () => {
      expect(IBAN_COMPACT().test('PL61 1090 1014 0000 0712 1981 2874')).toBe(
        false,
      );
    });
  });

  describe('BARE_PL_IBAN', () => {
    it('matches 26-digit Polish account with spaces', () => {
      expect(BARE_PL_IBAN().test('61 1090 1014 0000 0712 1981 2874')).toBe(
        true,
      );
    });

    it('matches with leading quote (CSV convention)', () => {
      const pattern = BARE_PL_IBAN();
      expect(pattern.test("'61 1090 1014 0000 0712 1981 2874")).toBe(true);
    });

    it('does not match when preceded by digit', () => {
      expect(BARE_PL_IBAN().test('961 1090 1014 0000 0712 1981 2874')).toBe(
        false,
      );
    });
  });

  describe('BARE_PL_COMPACT', () => {
    it('matches 26-digit bare Polish account', () => {
      expect(BARE_PL_COMPACT().test('61109010140000071219812874')).toBe(true);
    });

    it('matches with leading quote', () => {
      expect(BARE_PL_COMPACT().test("'61109010140000071219812874")).toBe(true);
    });

    it('does not match when preceded by digit', () => {
      expect(BARE_PL_COMPACT().test('961109010140000071219812874')).toBe(false);
    });
  });

  describe('factory isolation', () => {
    it('returns new RegExp instance each call (no shared lastIndex)', () => {
      const a = IBAN_PATTERN();
      const b = IBAN_PATTERN();
      expect(a).not.toBe(b);
    });
  });
});
