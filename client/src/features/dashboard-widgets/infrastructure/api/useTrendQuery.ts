import type { ChartSeries } from '#shared/adapters/charts';

interface TrendQueryResult {
  readonly data: ChartSeries[];
  readonly isLoading: boolean;
}

const MOCK_DATA: ChartSeries[] = [
  {
    id: 'Przychody',
    data: [
      { x: 'Sty', y: 7200 }, { x: 'Lut', y: 7800 }, { x: 'Mar', y: 8100 },
      { x: 'Kwi', y: 7600 }, { x: 'Maj', y: 8500 }, { x: 'Cze', y: 8500 },
    ],
  },
  {
    id: 'Wydatki',
    data: [
      { x: 'Sty', y: 5400 }, { x: 'Lut', y: 6100 }, { x: 'Mar', y: 5800 },
      { x: 'Kwi', y: 6400 }, { x: 'Maj', y: 5900 }, { x: 'Cze', y: 6050 },
    ],
  },
];

export const useTrendQuery = (): TrendQueryResult => ({
  data: MOCK_DATA,
  isLoading: false,
});
