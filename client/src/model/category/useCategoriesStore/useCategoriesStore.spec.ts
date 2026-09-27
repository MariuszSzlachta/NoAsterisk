import { afterEach, describe, expect, it } from 'vitest';

import { useCategoriesStore } from './useCategoriesStore';

describe('useCategoriesStore', () => {
  afterEach(() => {
    useCategoriesStore.setState({ categories: [] });
  });

  it('replaces the category collection', () => {
    const categories = [
      { id: 'cat-1', label: 'Groceries', color: '#4ade80' },
      { id: 'cat-2', label: 'Transport', color: '#f59e0b' },
    ];

    useCategoriesStore.getState().setCategories(categories);

    expect(useCategoriesStore.getState().categories).toEqual(categories);
  });
});
