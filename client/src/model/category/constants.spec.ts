import { describe, expect, it } from 'vitest';

import { CATEGORY_SELECT_OPTIONS, STUB_CATEGORIES } from './constants';

describe('category constants', () => {
  it('provides a unique select option for every stub category', () => {
    expect(CATEGORY_SELECT_OPTIONS).toHaveLength(STUB_CATEGORIES.length);
    expect(new Set(CATEGORY_SELECT_OPTIONS.map((option) => option.value)).size).toBe(
      STUB_CATEGORIES.length,
    );
    expect(CATEGORY_SELECT_OPTIONS).toEqual(
      STUB_CATEGORIES.map((category) => ({
        value: category.id,
        label: category.label,
      })),
    );
  });
});
