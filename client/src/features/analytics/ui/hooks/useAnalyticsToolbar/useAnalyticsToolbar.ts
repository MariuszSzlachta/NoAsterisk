import type {
  AnalyticsFilters,
  ChartType,
  Granularity,
  MetricType,
  Period,
} from '#features/analytics/model/types';

interface UseAnalyticsToolbarResult {
  readonly createToggleMetricHandler: (metric: MetricType) => () => void;
  readonly createSetPeriodHandler: (period: Period) => () => void;
  readonly createSetChartTypeHandler: (chartType: ChartType) => () => void;
  readonly createSetGranularityHandler: (
    granularity: Granularity,
  ) => () => void;
}

export const useAnalyticsToolbar = (
  filters: AnalyticsFilters,
  onFiltersChange: (filters: AnalyticsFilters) => void,
): UseAnalyticsToolbarResult => {
  const createToggleMetricHandler = (metric: MetricType) => (): void => {
    const metrics = filters.metrics.includes(metric)
      ? filters.metrics.filter((m) => m !== metric)
      : [...filters.metrics, metric];
    if (metrics.length > 0) {
      onFiltersChange({ ...filters, metrics });
    }
  };

  const createSetPeriodHandler = (period: Period) => (): void => {
    onFiltersChange({ ...filters, period });
  };

  const createSetChartTypeHandler = (chartType: ChartType) => (): void => {
    onFiltersChange({ ...filters, chartType });
  };

  const createSetGranularityHandler =
    (granularity: Granularity) => (): void => {
      onFiltersChange({ ...filters, granularity });
    };

  return {
    createToggleMetricHandler,
    createSetPeriodHandler,
    createSetChartTypeHandler,
    createSetGranularityHandler,
  };
};
