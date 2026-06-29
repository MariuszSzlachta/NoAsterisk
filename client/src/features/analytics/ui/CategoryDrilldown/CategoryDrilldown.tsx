import { useTranslation } from 'react-i18next';

import { useCategoryDrilldownQuery } from '#features/analytics/api/useCategoryDrilldownQuery';
import type { CategoryBreakdownFilters } from '#features/analytics/model/types';
import { TransactionRow } from '#features/analytics/ui/TransactionRow';
import { LineChart } from '#shared/adapters/charts';
import { Button } from '#shared/ui/Button';
import { QueryRenderer } from '#shared/ui/QueryRenderer';

const TREND_HEIGHT = 180;

interface CategoryDrilldownProps {
  readonly id: string;
  readonly category: string;
  readonly color: string;
  readonly filters: CategoryBreakdownFilters;
  readonly onClose: () => void;
}

export const CategoryDrilldown = ({
  id,
  category,
  color,
  filters,
  onClose,
}: CategoryDrilldownProps): React.JSX.Element => {
  const { t } = useTranslation();
  const state = useCategoryDrilldownQuery(category, filters);

  return (
    <div
      id={id}
      role="region"
      aria-label={category}
      className="rounded-lg border border-border bg-surface-2 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">{category}</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label={t('analytics.drilldown.close')}
        >
          {t('analytics.drilldown.close')}
        </Button>
      </div>
      <QueryRenderer state={state}>
        {(data) => (
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-xs text-muted-foreground">
                {t('analytics.drilldown.trendTitle')}
              </p>
              <LineChart
                data={[data.trend]}
                height={TREND_HEIGHT}
                colors={[color]}
              />
            </div>
            <div>
              <p className="mb-2 text-xs text-muted-foreground">
                {t('analytics.drilldown.transactionsTitle')}
              </p>
              <ul className="divide-y divide-border">
                {data.transactions.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    isExpense={filters.metric === 'expenses'}
                    color={color}
                  />
                ))}
              </ul>
            </div>
          </div>
        )}
      </QueryRenderer>
    </div>
  );
};
