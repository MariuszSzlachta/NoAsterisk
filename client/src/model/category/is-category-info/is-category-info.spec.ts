import { describe, expect, it } from 'vitest';

import { isCategoryInfo } from './is-category-info';

describe('isCategoryInfo', () => {
  it('accepts a complete category record', () => {
    expect(
      isCategoryInfo({ id: 'cat-1', label: 'Groceries', color: '#4ade80' }),
    ).toBe(true);
  });

  it.each([
    null,
    {},
    { id: 1, label: 'Groceries', color: '#4ade80' },
    { id: 'cat-1', label: 1, color: '#4ade80' },
    { id: 'cat-1', label: 'Groceries', color: 1 },
  ])('rejects an invalid category record: %o', (value) => {
    expect(isCategoryInfo(value)).toBe(false);
  });
});
