import type { ChartSeries } from '#shared/adapters/charts/ports/chart.port';

import { getYRange } from './getYRange';
import { roundToNiceStep } from './roundToNiceStep';

const MAX_Y_TICKS = 5;

/**
 * Generates an array of evenly spaced "nice" tick values for the Y axis.
 * Returns concrete values so Nivo renders exactly these — no duplicates.
 */
export const computeYTickValues = (data: ChartSeries[]): number[] => {
  const { min, max } = getYRange(data);
  const range = max - min;

  if (range === 0) return [min];

  const niceStep = roundToNiceStep(range / MAX_Y_TICKS);
  const niceMin = Math.floor(min / niceStep) * niceStep;
  const niceMax = Math.ceil(max / niceStep) * niceStep;

  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax; v += niceStep) {
    ticks.push(v);
  }

  return ticks;
};
