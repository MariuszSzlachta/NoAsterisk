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
  { label: 'Zdrowie', value: 430 },
  { label: 'Edukacja', value: 350 },
  { label: 'Odzież', value: 520 },
  { label: 'Elektronika', value: 780 },
  { label: 'Prezenty', value: 290 },
  { label: 'Sport', value: 410 },
  { label: 'Podróże', value: 650 },
  { label: 'Zwierzęta', value: 180 },
  { label: 'Dom i ogród', value: 370 },
  { label: 'Kosmetyki', value: 260 },
];

export const useCategoryBreakdownQuery = (): CategoryQueryResult => ({
  data: MOCK_DATA,
  isLoading: false,
});
