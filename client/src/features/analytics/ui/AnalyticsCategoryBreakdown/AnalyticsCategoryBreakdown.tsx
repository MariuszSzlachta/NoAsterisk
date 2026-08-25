import { useTranslation } from 'react-i18next';

import type { CategoryBreakdownFilters } from '#features/analytics/model/types';
import { BreakdownListItem } from '#features/analytics/ui/BreakdownListItem';
import { CategoryDrilldown } from '#features/analytics/ui/CategoryDrilldown';
import { useCategoryBreakdown } from '#features/analytics/ui/hooks/useCategoryBreakdown';
import { Card, CardHeader } from '#shared/ui/Card';
import { QueryRenderer } from '#shared/ui/QueryRenderer';

const CATEGORY_COLORS = [
  'var(--cat-groceries)',
  'var(--cat-transport)',
  'var(--cat-subscriptions)',
  'var(--cat-dining)',
  'var(--cat-bills)',
  'var(--cat-entertainment)',
] as const;

const DEFAULT_COLOR = CATEGORY_COLORS[0];

const getCategoryColor = (index: number): string =>
  CATEGORY_COLORS[index % CATEGORY_COLORS.length] ?? DEFAULT_COLOR;

const DRILLDOWN_ID = 'category-drilldown-panel';

interface AnalyticsCategoryBreakdownProps {
  readonly filters: CategoryBreakdownFilters;
}

export const AnalyticsCategoryBreakdown = ({
  filters,
}: AnalyticsCategoryBreakdownProps): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    state,
    selectedCategory,
    createCategoryClickHandler,
    handleDrilldownClose,
  } = useCategoryBreakdown(filters);

  return (
    <Card>
      <CardHeader
        title={
          filters.metric === 'expenses'
            ? t('analytics.breakdown.expensesTitle')
            : t('analytics.breakdown.incomeTitle')
        }
      />
      <QueryRenderer state={state}>
        {(items) => {
          if (items.length === 0) {
            return (
              <p className="px-4 pb-4 text-sm text-muted-foreground">
                {filters.metric === 'expenses'
                  ? t('analytics.breakdown.noExpenses')
                  : t('analytics.breakdown.noIncome')}
              </p>
            );
          }

          const maxAmount = Math.max(...items.map((i) => i.amount), 0);

          return (
            <div className="flex flex-col gap-4">
              <ul className="flex flex-col gap-2">
                {items.map((item, index) => (
                  <BreakdownListItem
                    key={item.categoryId}
                    item={item}
                    color={getCategoryColor(index)}
                    maxAmount={maxAmount}
                    isSelected={selectedCategory === item.category}
                    drilldownId={DRILLDOWN_ID}
                    onClick={createCategoryClickHandler(item.category)}
                  />
                ))}
              </ul>
              {selectedCategory !== undefined ? (
                <CategoryDrilldown
                  id={DRILLDOWN_ID}
                  category={selectedCategory}
                  color={getCategoryColor(
                    items.findIndex((i) => i.category === selectedCategory),
                  )}
                  filters={filters}
                  onClose={handleDrilldownClose}
                />
              ) : null}
            </div>
          );
        }}
      </QueryRenderer>
    </Card>
  );
};
