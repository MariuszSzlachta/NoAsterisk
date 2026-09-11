import { useTranslation } from 'react-i18next';

import type {
  AnalyticsFilters,
  ChartType,
  Granularity,
  MetricType,
  Period,
} from '#features/analytics/model/types';
import { useAnalyticsToolbar } from '#features/analytics/ui/hooks/useAnalyticsToolbar';

const METRICS: MetricType[] = ['balance', 'income', 'expenses', 'savings'];
const PERIODS: Period[] = ['1m', '3m', '6m', '1y', 'ytd'];
const CHART_TYPES: ChartType[] = ['line', 'bar', 'area'];
const GRANULARITIES: Granularity[] = ['daily', 'weekly', 'monthly'];

interface AnalyticsFilterControlsProps {
  readonly filters: AnalyticsFilters;
  readonly onFiltersChange: (filters: AnalyticsFilters) => void;
  readonly variant: 'desktop' | 'mobile';
}

const getDesktopButtonClass = (active: boolean): string =>
  `rounded-md px-2 py-1 text-xs font-medium transition-colors ${
    active
      ? 'bg-primary text-white'
      : 'bg-surface-2 text-muted-foreground hover:text-foreground'
  }`;

const getMobileButtonClass = (active: boolean): string =>
  `min-h-12 rounded-md px-3 py-3 text-sm font-medium transition-colors ${
    active
      ? 'bg-primary text-primary-foreground'
      : 'bg-surface-2 text-muted-foreground hover:text-foreground'
  }`;

export const AnalyticsFilterControls = ({
  filters,
  onFiltersChange,
  variant,
}: AnalyticsFilterControlsProps): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    createToggleMetricHandler,
    createSetPeriodHandler,
    createSetChartTypeHandler,
    createSetGranularityHandler,
  } = useAnalyticsToolbar(filters, onFiltersChange);

  if (variant === 'mobile') {
    return (
      <div className="flex flex-col gap-5">
        <div role="group" aria-label="Metryki" className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">{t('analytics.filters.metrics')}</span>
          <div className="grid grid-cols-2 gap-2">
            {METRICS.map((metric) => (
              <button
                key={metric}
                type="button"
                aria-pressed={filters.metrics.includes(metric)}
                onClick={createToggleMetricHandler(metric)}
                className={getMobileButtonClass(filters.metrics.includes(metric))}
              >
                {t(`analytics.metrics.${metric}`)}
              </button>
            ))}
          </div>
        </div>

        <div role="group" aria-label="Typ wykresu" className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">{t('analytics.filters.chartType')}</span>
          <div className="grid grid-cols-3 gap-2">
            {CHART_TYPES.map((chartType) => (
              <button
                key={chartType}
                type="button"
                aria-pressed={filters.chartType === chartType}
                onClick={createSetChartTypeHandler(chartType)}
                className={getMobileButtonClass(filters.chartType === chartType)}
              >
                {t(`analytics.chartTypes.${chartType}`)}
              </button>
            ))}
          </div>
        </div>

        <div role="group" aria-label="Okres" className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">{t('analytics.filters.period')}</span>
          <div className="grid grid-cols-3 gap-2">
            {PERIODS.map((period) => (
              <button
                key={period}
                type="button"
                aria-pressed={filters.period === period}
                onClick={createSetPeriodHandler(period)}
                className={getMobileButtonClass(filters.period === period)}
              >
                {t(`analytics.periods.${period}`)}
              </button>
            ))}
          </div>
        </div>

        <div role="group" aria-label="Granularność" className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">{t('analytics.filters.granularity')}</span>
          <div className="grid grid-cols-3 gap-2">
            {GRANULARITIES.map((granularity) => (
              <button
                key={granularity}
                type="button"
                aria-pressed={filters.granularity === granularity}
                onClick={createSetGranularityHandler(granularity)}
                className={getMobileButtonClass(filters.granularity === granularity)}
              >
                {t(`analytics.granularity.${granularity}`)}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border-strong bg-surface p-3">
      <div role="group" aria-label="Metryki" className="flex flex-wrap gap-1.5">
        {METRICS.map((metric) => (
          <button
            key={metric}
            type="button"
            aria-pressed={filters.metrics.includes(metric)}
            onClick={createToggleMetricHandler(metric)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              filters.metrics.includes(metric)
                ? 'bg-primary text-white'
                : 'bg-surface-2 text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(`analytics.metrics.${metric}`)}
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-border" />

      <div role="group" aria-label="Typ wykresu" className="flex gap-1">
        {CHART_TYPES.map((chartType) => (
          <button
            key={chartType}
            type="button"
            aria-pressed={filters.chartType === chartType}
            onClick={createSetChartTypeHandler(chartType)}
            className={getDesktopButtonClass(filters.chartType === chartType)}
          >
            {t(`analytics.chartTypes.${chartType}`)}
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-border" />

      <div role="group" aria-label="Okres" className="flex gap-1">
        {PERIODS.map((period) => (
          <button
            key={period}
            type="button"
            aria-pressed={filters.period === period}
            onClick={createSetPeriodHandler(period)}
            className={getDesktopButtonClass(filters.period === period)}
          >
            {t(`analytics.periods.${period}`)}
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-border" />

      <div role="group" aria-label="Granularność" className="flex gap-1">
        {GRANULARITIES.map((granularity) => (
          <button
            key={granularity}
            type="button"
            aria-pressed={filters.granularity === granularity}
            onClick={createSetGranularityHandler(granularity)}
            className={getDesktopButtonClass(filters.granularity === granularity)}
          >
            {t(`analytics.granularity.${granularity}`)}
          </button>
        ))}
      </div>
    </div>
  );
};
