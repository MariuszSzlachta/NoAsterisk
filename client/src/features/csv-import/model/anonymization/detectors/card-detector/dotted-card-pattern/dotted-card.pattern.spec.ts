import { describe, expect, it } from 'vitest';

import { DOTTED_CARD } from './dotted-card.pattern';

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
