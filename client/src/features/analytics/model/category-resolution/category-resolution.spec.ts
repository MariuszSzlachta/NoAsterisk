import { describe, expect, it } from 'vitest';

import { getCategoryI18nKey, getCategoryLabel } from './category-resolution';

describe('getCategoryLabel', () => {
  it('returns Polish label for known category', () => {
    expect(getCategoryLabel('cat-groceries')).toBe('Spożywcze');
    expect(getCategoryLabel('cat-transport')).toBe('Transport');
  });

  it('returns categoryId as-is for unknown category', () => {
    expect(getCategoryLabel('cat-unknown-xyz')).toBe('cat-unknown-xyz');
  });

  it('returns "Bez kategorii" for undefined', () => {
    expect(getCategoryLabel(undefined)).toBe('Bez kategorii');
  });

  it('returns "Bez kategorii" for empty string', () => {
    // empty string is falsy → treated as undefined
    expect(getCategoryLabel('')).toBe('Bez kategorii');
  });
});

describe('getCategoryI18nKey', () => {
  it('returns i18n key for known category', () => {
    expect(getCategoryI18nKey('cat-groceries')).toBe('categories.groceries');
    expect(getCategoryI18nKey('cat-salary')).toBe('categories.salary');
  });

  it('returns categoryId for unknown category (no key exists)', () => {
    expect(getCategoryI18nKey('cat-fantasy')).toBe('cat-fantasy');
  });

  it('returns uncategorized key for undefined', () => {
    expect(getCategoryI18nKey(undefined)).toBe('categories.uncategorized');
  });
});
