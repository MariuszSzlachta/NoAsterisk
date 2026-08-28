import { describe, expect, it } from 'vitest';

import { stripParenthetical } from '#features/csv-import/model/column-mapping/normalize-header/strip-parenthetical';

describe('stripParenthetical', () => {
  it('removes trailing parenthetical', () => {
    expect(stripParenthetical('Kwota (PLN)')).toBe('Kwota');
  });

  it('returns unchanged when no parenthetical', () => {
    expect(stripParenthetical('Kwota')).toBe('Kwota');
  });

  it('only strips trailing parenthetical, not mid-string', () => {
    expect(stripParenthetical('Kwota (PLN) extra')).toBe('Kwota (PLN) extra');
  });
});
