import { describe, expect, it } from 'vitest';

import { BARE_PL_IBAN } from './bare-pl-iban.pattern';

describe('BARE_PL_IBAN', () => {
  it('matches 26-digit Polish account with spaces', () => {
    expect(BARE_PL_IBAN().test('61 1090 1014 0000 0712 1981 2874')).toBe(
      true,
    );
  });

  it('matches with leading quote (CSV convention)', () => {
    const pattern = BARE_PL_IBAN();
    expect(pattern.test("'61 1090 1014 0000 0712 1981 2874")).toBe(true);
  });

  it('does not match when preceded by digit', () => {
    expect(BARE_PL_IBAN().test('961 1090 1014 0000 0712 1981 2874')).toBe(
      false,
    );
  });
});
