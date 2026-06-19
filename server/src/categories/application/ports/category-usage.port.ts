export const CATEGORY_USAGE_PORT = Symbol('CATEGORY_USAGE_PORT');

export interface CategoryUsagePort {
  isCategoryInUse(categoryId: string): Promise<boolean>;
}
