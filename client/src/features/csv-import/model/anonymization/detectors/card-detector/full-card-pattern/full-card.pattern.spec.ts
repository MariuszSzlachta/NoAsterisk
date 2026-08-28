import { describe, expect, it } from 'vitest';

import { FULL_CARD } from './full-card.pattern';

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

  it('returns new RegExp instance each call (no shared lastIndex)', () => {
    const a = FULL_CARD();
    const b = FULL_CARD();
    expect(a).not.toBe(b);
  });
});
