import { describe, expect, it } from 'vitest';

import { COMPACT_CARD } from './compact-card.pattern';

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
