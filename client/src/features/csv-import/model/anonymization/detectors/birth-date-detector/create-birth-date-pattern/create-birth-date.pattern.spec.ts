import { describe, expect, it } from 'vitest';

import { createBirthDatePattern } from './create-birth-date.pattern';

describe('createBirthDatePattern', () => {
  it.each([
    ['ur. 15.03.1992', 'ur. 15.03.1992'],
    ['urodzona 15-03-1992', 'urodzona 15-03-1992'],
    ['data urodzenia: 15/03/92', 'data urodzenia: 15/03/92'],
    ['urodzony 01.01.1985', 'urodzony 01.01.1985'],
    ['ur: 22.11.1988', 'ur: 22.11.1988'],
    ['born 05/12/1990', 'born 05/12/1990'],
    ['d.o.b. 31.12.2000', 'd.o.b. 31.12.2000'],
    ['data ur. 10.05.1975', 'data ur. 10.05.1975'],
    ['dat. ur. 03.07.1999', 'dat. ur. 03.07.1999'],
  ])('matches: "%s"', (input, expected) => {
    const pattern = createBirthDatePattern();
    const match = pattern.exec(input);

    expect(match).not.toBeNull();
    expect(match[0]).toBe(expected);
  });

  it.each([
    'Data: 15.03.1992 transakcja',
    'Faktura 12/03/24 opłacona',
    '15.03.1992',
    'przelew 01-01-2024 za usługę',
    'kwota 500.00 zł',
  ])('does NOT match: "%s"', (input) => {
    const pattern = createBirthDatePattern();

    expect(pattern.exec(input)).toBeNull();
  });

  it('matches birth date embedded in longer text', () => {
    const pattern = createBirthDatePattern();
    const match = pattern.exec('Wpłata Jan Kowalski ur. 22.11.1988 przelew');

    expect(match).not.toBeNull();
    expect(match[0]).toBe('ur. 22.11.1988');
  });

  it('returns fresh instance (no shared lastIndex)', () => {
    const p1 = createBirthDatePattern();
    const p2 = createBirthDatePattern();

    p1.exec('ur. 15.03.1992');

    expect(p2.lastIndex).toBe(0);
  });
});
