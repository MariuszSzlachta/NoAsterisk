import { create } from 'zustand';

import type { CategoryInfo } from '#entities/category/types';

interface CategoriesState {
  readonly categories: ReadonlyArray<CategoryInfo>;
  readonly setCategories: (categories: ReadonlyArray<CategoryInfo>) => void;
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  categories: [],
  setCategories: (categories) => set({ categories }),
}));
