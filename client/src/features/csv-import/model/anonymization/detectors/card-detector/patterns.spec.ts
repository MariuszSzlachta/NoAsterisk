import { describe, expect, it } from 'vitest';

import {
  BIN_LAST4,
  COMPACT_CARD,
  DOTTED_CARD,
  FULL_CARD,
  MASKED_CARD_SPACED,
  SHORT_MASKED,
} from './patterns';

describe('card patterns', () => {
  describe('FULL_CARD', () => {
    it.each([
      '4532 0151 2345 6789',
      '5425-2334-3010-9903',
      '4111 1111 1111 1111',
    ])('matches "%s"', (input) => {
      expect(FULL_CARD().test(input)).toBe(true);
    });

    it.each(['4532015123456789', '4532 0151 2345', '4532 0151 2345 678'])(
      'does not match "%s"',
      (input) => {
        expect(FULL_CARD().test(input)).toBe(false);
      },
    );
  });

  describe('COMPACT_CARD', () => {
    it.each(['4532015123456789', '4111111111111111'])(
      'matches "%s"',
      (input) => {
        expect(COMPACT_CARD().test(input)).toBe(true);
      },
    );

    it.each(['411111111111', '41111111111111111'])(
      'does not match "%s"',
      (input) => {
        expect(COMPACT_CARD().test(input)).toBe(false);
      },
    );
  });

  describe('MASKED_CARD_SPACED', () => {
    it.each([
      '**** **** **** 4820',
      'XXXX-XXXX-XXXX-9903',
      'xxxx xxxx xxxx 1234',
    ])('matches "%s"', (input) => {
      expect(MASKED_CARD_SPACED().test(input)).toBe(true);
    });

    it.each(['**** **** 4820', '1234 5678 9012 3456'])(
      'does not match "%s"',
      (input) => {
        expect(MASKED_CARD_SPACED().test(input)).toBe(false);
      },
    );
  });

  describe('DOTTED_CARD', () => {
    it.each(['6011....4820', '4532..4820', '4532........4820'])(
      'matches "%s"',
      (input) => {
        expect(DOTTED_CARD().test(input)).toBe(true);
      },
    );

    it.each(['6011.4820', '60114820'])('does not match "%s"', (input) => {
      expect(DOTTED_CARD().test(input)).toBe(false);
    });
  });

  describe('SHORT_MASKED', () => {
    it.each(['****4820', 'XXXX9903', 'xxxx1234'])('matches "%s"', (input) => {
      expect(SHORT_MASKED().test(input)).toBe(true);
    });

    it.each(['***4820', '****48201'])('does not match "%s"', (input) => {
      expect(SHORT_MASKED().test(input)).toBe(false);
    });
  });

  describe('BIN_LAST4', () => {
    it.each(['601112******4820', '453201****4820', '601112XXXX4820'])(
      'matches "%s"',
      (input) => {
        expect(BIN_LAST4().test(input)).toBe(true);
      },
    );

    it.each(['6011**4820', '601112*******48201'])(
      'does not match "%s"',
      (input) => {
        expect(BIN_LAST4().test(input)).toBe(false);
      },
    );
  });

  describe('factory isolation', () => {
    it('returns new RegExp instance each call (no shared lastIndex)', () => {
      const a = FULL_CARD();
      const b = FULL_CARD();
      expect(a).not.toBe(b);
    });
  });
});
