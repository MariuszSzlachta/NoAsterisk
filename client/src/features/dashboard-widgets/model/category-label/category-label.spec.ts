import { describe, expect, it } from 'vitest';

import type { CategoryInfo } from '#model/category';

import {
  createCategoryLabelMap,
  getDashboardCategoryLabel,
} from './category-label';

describe('dashboard category labels', () => {
  it('uses the built-in label when persisted data contains the category id as label', () => {
    const categories: CategoryInfo[] = [
      {
        id: 'cat-groceries',
        label: 'cat-groceries',
        color: '#4ade80',
      },
    ];

    const labels = createCategoryLabelMap(categories);

    expect(getDashboardCategoryLabel('cat-groceries', labels)).toBe(
      'Spożywcze',
    );
  });

  it('preserves labels for custom categories', () => {
    const labels = createCategoryLabelMap([
      { id: 'custom-food', label: 'Jedzenie na mieście', color: '#fff' },
    ]);

    expect(getDashboardCategoryLabel('custom-food', labels)).toBe(
      'Jedzenie na mieście',
    );
  });

  it('falls back to the uncategorized label', () => {
    const labels = createCategoryLabelMap([]);

    expect(getDashboardCategoryLabel('unknown', labels)).toBe('Bez kategorii');
    expect(getDashboardCategoryLabel(undefined, labels)).toBe('Bez kategorii');
  });
});
