import { describe, expect, it } from 'vitest';

import { BIN_LAST4 } from './bin-last4.pattern';

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
