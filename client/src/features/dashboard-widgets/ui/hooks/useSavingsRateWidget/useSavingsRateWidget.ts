import { useSavingsRateQuery } from '#features/dashboard-widgets/api/useSavingsRateQuery';
import { getRateColor } from '#features/dashboard-widgets/model/transformers';
import type { QueryState } from '#shared/api';

export interface SavingsRateVM {
  readonly rate: number;
  readonly savedAmount: string;
  readonly income: string;
  readonly color: string;
  readonly strokeOffset: number;
}

const STROKE_WIDTH = 12;
const RING_SIZE = 160;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const useSavingsRateWidget = (): QueryState<SavingsRateVM> => {
  const state = useSavingsRateQuery();
  if (state.status !== 'loaded') {
    return state;
  }

  const { rate, savedAmount, income } = state.data;
  return {
    status: 'loaded',
    data: {
      rate,
      savedAmount,
      income,
      color: getRateColor(rate),
      strokeOffset: CIRCUMFERENCE * (1 - rate / 100),
    },
  };
};
