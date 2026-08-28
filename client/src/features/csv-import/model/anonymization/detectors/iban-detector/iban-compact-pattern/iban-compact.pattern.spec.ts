import { describe, expect, it } from 'vitest';

import { IBAN_COMPACT } from './iban-compact.pattern';

describe('IBAN_COMPACT', () => {
  it('matches compact PL IBAN', () => {
    expect(IBAN_COMPACT().test('PL61109010140000071219812874')).toBe(true);
  });

  it('does not match IBAN with spaces', () => {
    expect(IBAN_COMPACT().test('PL61 1090 1014 0000 0712 1981 2874')).toBe(
      false,
    );
  });
});
