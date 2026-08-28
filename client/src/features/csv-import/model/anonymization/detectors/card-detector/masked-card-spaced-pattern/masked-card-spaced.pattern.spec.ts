import { describe, expect, it } from 'vitest';

import { MASKED_CARD_SPACED } from './masked-card-spaced.pattern';

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
