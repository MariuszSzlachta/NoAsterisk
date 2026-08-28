import { describe, expect, it } from 'vitest';

import { BARE_PL_COMPACT } from './bare-pl-compact.pattern';

describe('BARE_PL_COMPACT', () => {
  it('matches 26-digit bare Polish account', () => {
    expect(BARE_PL_COMPACT().test('61109010140000071219812874')).toBe(true);
  });

  it('matches with leading quote', () => {
    expect(BARE_PL_COMPACT().test("'61109010140000071219812874")).toBe(true);
  });

  it('does not match when preceded by digit', () => {
    expect(BARE_PL_COMPACT().test('961109010140000071219812874')).toBe(false);
  });
});
