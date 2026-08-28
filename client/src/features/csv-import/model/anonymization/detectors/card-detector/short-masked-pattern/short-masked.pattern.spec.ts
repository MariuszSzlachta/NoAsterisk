import { describe, expect, it } from 'vitest';

import { SHORT_MASKED } from './short-masked.pattern';

describe('SHORT_MASKED', () => {
  it.each(['****4820', 'XXXX9903', 'xxxx1234'])('matches "%s"', (input) => {
    expect(SHORT_MASKED().test(input)).toBe(true);
  });

  it.each(['***4820', '****48201'])('does not match "%s"', (input) => {
    expect(SHORT_MASKED().test(input)).toBe(false);
  });
});
