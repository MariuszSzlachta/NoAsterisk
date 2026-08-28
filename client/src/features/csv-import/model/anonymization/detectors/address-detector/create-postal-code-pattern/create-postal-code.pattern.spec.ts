import { describe, expect, it } from 'vitest';

import { createPostalCodePattern } from './create-postal-code.pattern';

describe('createPostalCodePattern', () => {
  it.each([
    ['00-001 Warszawa', '00-001 Warszawa'],
    ['30-500 Kraków', '30-500 Kraków'],
    ['80-200 Gdańsk-Wrzeszcz', '80-200 Gdańsk-Wrzeszcz'],
    ['61-701 Poznań Centrum', '61-701 Poznań Centrum'],
  ])('matches: "%s"', (input, expected) => {
    const pattern = createPostalCodePattern();
    const match = pattern.exec(input);

    expect(match).not.toBeNull();
    expect(match![0]).toBe(expected);
  });

  it.each(['12345 no dash', '1-234 wrong format', '00-001', 'przelew 12-345'])(
    'does NOT match: "%s"',
    (input) => {
      const pattern = createPostalCodePattern();

      expect(pattern.exec(input)).toBeNull();
    },
  );

  it('returns fresh instance (no shared lastIndex)', () => {
    const p1 = createPostalCodePattern();
    const p2 = createPostalCodePattern();

    p1.exec('00-001 Warszawa');

    expect(p2.lastIndex).toBe(0);
  });
});
