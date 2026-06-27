import type { ChartDataPoint } from '#shared/adapters/charts';

interface CategoryQueryResult {
  readonly data: ChartDataPoint[];
  readonly isLoading: boolean;
}

const MOCK_DATA: ChartDataPoint[] = [
  { label: 'Zakupy', value: 1850 },
  { label: 'Transport', value: 620 },
  { label: 'Subskrypcje', value: 340 },
  { label: 'Jedzenie', value: 890 },
  { label: 'Rachunki', value: 1450 },
  { label: 'Rozrywka', value: 900 },
];

export const useCategoryBreakdownQuery = (): CategoryQueryResult => ({
  data: MOCK_DATA,
  isLoading: false,
});
