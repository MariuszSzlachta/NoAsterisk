import type { ChartSeries } from '#shared/adapters/charts';

type Translate = (key: string) => string;

const localizeMonthLabel = (
  value: string | number,
  translate: Translate,
): string | number => {
  if (typeof value !== 'string' || !value.startsWith('months.')) {
    return value;
  }

  const [monthKey, year] = value.split(':');
  if (!monthKey) {
    return value;
  }

  const localizedMonth = translate(monthKey);
  return year ? `${localizedMonth}:${year}` : localizedMonth;
};

/** Localizes chart x-axis month keys while preserving all other x values. */
export const localizeChartSeriesLabels = (
  series: readonly ChartSeries[],
  translate: Translate,
): ChartSeries[] =>
  series.map((item) => ({
    ...item,
    data: item.data.map((point) => ({
      ...point,
      x: localizeMonthLabel(point.x, translate),
    })),
  }));
