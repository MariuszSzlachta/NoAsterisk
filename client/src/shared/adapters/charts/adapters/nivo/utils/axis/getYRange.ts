import type { ChartSeries } from '#shared/adapters/charts/ports/chart.port';

interface YRange {
  readonly min: number;
  readonly max: number;
}

/**
 * Extracts min/max Y values from chart series data.
 */
export const getYRange = (data: ChartSeries[]): YRange => {
  const allY = data.flatMap((s) => s.data.map((d) => d.y));
  if (allY.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...allY), max: Math.max(...allY) };
};
