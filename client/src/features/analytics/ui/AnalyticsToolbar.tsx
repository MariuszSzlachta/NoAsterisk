import { useTranslation } from 'react-i18next';

import type {
  AnalyticsFilters,
  ChartType,
  Granularity,
  MetricType,
  Period,
} from '#features/analytics/model/types';

interface AnalyticsToolbarProps {
  readonly filters: AnalyticsFilters;
  readonly onFiltersChange: (filters: AnalyticsFilters) => void;
}

const METRICS: MetricType[] = ['balance', 'income', 'expenses', 'savings'];
const PERIODS: Period[] = ['1m', '3m', '6m', '1y', 'ytd'];
const CHART_TYPES: ChartType[] = ['line', 'bar', 'area'];
const GRANULARITIES: Granularity[] = ['daily', 'weekly', 'monthly'];

export const AnalyticsToolbar = ({
  filters,
  onFiltersChange,
}: AnalyticsToolbarProps): React.JSX.Element => {
  const { t } = useTranslation();

  const toggleMetric = (metric: MetricType): void => {
    const metrics = filters.metrics.includes(metric)
      ? filters.metrics.filter((m) => m !== metric)
      : [...filters.metrics, metric];
    if (metrics.length > 0) {
      onFiltersChange({ ...filters, metrics });
    }
  };

  const setPeriod = (period: Period): void => {
    onFiltersChange({ ...filters, period });
  };

  const setChartType = (chartType: ChartType): void => {
    onFiltersChange({ ...filters, chartType });
  };

  const setGranularity = (granularity: Granularity): void => {
    onFiltersChange({ ...filters, granularity });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border-strong bg-surface p-3">
      <div role="group" aria-label="Metryki" className="flex flex-wrap gap-1.5">
        {METRICS.map((metric) => (
          <button
            key={metric}
            type="button"
            aria-pressed={filters.metrics.includes(metric)}
            onClick={() => toggleMetric(metric)}
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
        {CHART_TYPES.map((ct) => (
          <button
            key={ct}
            type="button"
            aria-pressed={filters.chartType === ct}
            onClick={() => setChartType(ct)}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              filters.chartType === ct
                ? 'bg-primary text-white'
                : 'bg-surface-2 text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(`analytics.chartTypes.${ct}`)}
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
            onClick={() => setPeriod(period)}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              filters.period === period
                ? 'bg-primary text-white'
                : 'bg-surface-2 text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(`analytics.periods.${period}`)}
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-border" />

      <div role="group" aria-label="Granularność" className="flex gap-1">
        {GRANULARITIES.map((g) => (
          <button
            key={g}
            type="button"
            aria-pressed={filters.granularity === g}
            onClick={() => setGranularity(g)}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              filters.granularity === g
                ? 'bg-primary text-white'
                : 'bg-surface-2 text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(`analytics.granularity.${g}`)}
          </button>
        ))}
      </div>
    </div>
  );
};
