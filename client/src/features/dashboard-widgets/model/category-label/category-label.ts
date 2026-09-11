import { STUB_CATEGORIES, type CategoryInfo } from '#entities/category';

const UNCATEGORIZED_LABEL = 'Bez kategorii';

export const createCategoryLabelMap = (
  categories: ReadonlyArray<CategoryInfo>,
): ReadonlyMap<string, string> => {
  const labels = new Map(
    categories.map((category) => [category.id, category.label]),
  );

  STUB_CATEGORIES.forEach((category) => {
    const currentLabel = labels.get(category.id);
    if (currentLabel === undefined || currentLabel === category.id) {
      labels.set(category.id, category.label);
    }
  });

  return labels;
};

export const getDashboardCategoryLabel = (
  categoryId: string | undefined,
  labels: ReadonlyMap<string, string>,
): string => {
  if (categoryId === undefined) {
    return UNCATEGORIZED_LABEL;
  }

  return labels.get(categoryId) ?? UNCATEGORIZED_LABEL;
};
