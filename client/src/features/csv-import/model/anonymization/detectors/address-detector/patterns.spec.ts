import { describe, expect, it } from 'vitest';

import { createAddressPattern, createPostalCodePattern } from './patterns';

describe('createAddressPattern', () => {
  it.each([
    ['ul. Marszałkowska 15', 'ul. Marszałkowska 15'],
    ['al. Jerozolimskie 42/5', 'al. Jerozolimskie 42/5'],
    ['os. Stefana Batorego 12', 'os. Stefana Batorego 12'],
    ['pl. Zbawiciela 1', 'pl. Zbawiciela 1'],
    ['ulica Długa 23A', 'ulica Długa 23A'],
    ['aleja Niepodległości 100', 'aleja Niepodległości 100'],
    ['osiedle Tysiąclecia 7', 'osiedle Tysiąclecia 7'],
    ['plac Zamkowy 4', 'plac Zamkowy 4'],
    ['ul. Jana Pawła II 21/3', 'ul. Jana Pawła II 21/3'],
  ])('matches: "%s"', (input, expected) => {
    const pattern = createAddressPattern();
    const match = pattern.exec(input);

    expect(match).not.toBeNull();
    expect(match![0]).toBe(expected);
  });

  it.each([
    'BIEDRONKA 1234 WARSZAWA zakupy',
    'przelew za usługę kwota 500',
    'Marszałkowska 15',
    'faktura 2024/01/15',
  ])('does NOT match: "%s"', (input) => {
    const pattern = createAddressPattern();

    expect(pattern.exec(input)).toBeNull();
  });

  it('returns fresh instance (no shared lastIndex)', () => {
    const p1 = createAddressPattern();
    const p2 = createAddressPattern();

    p1.exec('ul. Testowa 1');

    expect(p2.lastIndex).toBe(0);
  });
});

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
