import { describe, expect, it } from 'vitest';

import { IBAN_PATTERN } from './iban.pattern';

describe('IBAN_PATTERN', () => {
  it.each([
    'PL61 1090 1014 0000 0712 1981 2874',
    'PL61109010140000071219812874',
  ])('matches "%s"', (input) => {
    const pattern = IBAN_PATTERN();
    expect(pattern.test(input)).toBe(true);
  });

  it('does not match bare digits without country code', () => {
    expect(IBAN_PATTERN().test('61109010140000071219812874')).toBe(false);
  });

  it('returns new RegExp instance each call (no shared lastIndex)', () => {
    const a = IBAN_PATTERN();
    const b = IBAN_PATTERN();
    expect(a).not.toBe(b);
  });
});
