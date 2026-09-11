import type { AnalyticsSeries } from '#features/analytics/model/types';

const DEFAULT_MAX_TICKS = 4;

/** Keeps the first and last x-axis labels while sampling middle labels for narrow charts. */
export const getXAxisTickValues = (
  series: readonly AnalyticsSeries[],
  maxTicks = DEFAULT_MAX_TICKS,
): Array<string | number> => {
  const values = series[0]?.data.map((point) => point.x) ?? [];

  if (values.length <= maxTicks || maxTicks < 2) {
    return values;
  }

  const lastIndex = values.length - 1;
  const step = lastIndex / (maxTicks - 1);

  return Array.from({ length: maxTicks }, (_, index) => values[Math.round(index * step)])
    .filter(
      (value, index, ticks): value is string | number =>
        value !== undefined && ticks.indexOf(value) === index,
    );
};
