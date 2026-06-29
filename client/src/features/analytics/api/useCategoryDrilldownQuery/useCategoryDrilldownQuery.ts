import type {
  CategoryBreakdownFilters,
  CategoryDrilldownData,
  CategoryDrilldownTransaction,
} from '#features/analytics/model/types';
import type {
  ChartSeries,
  ChartSeriesDataPoint,
} from '#shared/adapters/charts';
import type { QueryState } from '#shared/api';

const MONTHS = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze'];

const MOCK_TRENDS: Record<string, number[]> = {
  Żywność: [1950, 2200, 2050, 2300, 2100, 2150],
  Transport: [1200, 1350, 1500, 1280, 1400, 1430],
  Subskrypcje: [1050, 1050, 1070, 1070, 1070, 1070],
  'Jedzenie na mieście': [45, 900, 850, 78, 2400, 860],
  Rachunki: [880, 900, 950, 920, 960, 930],
  Rozrywka: [12, 3500, 80, 2800, 50, 4100],
  Wynagrodzenie: [7000, 7000, 7000, 7000, 7000, 7000],
  Freelance: [0, 4500, 0, 6000, 0, 1000],
  Inne: [200, 300, 100, 600, 400, 500],
};

const MOCK_TRANSACTIONS: Record<string, CategoryDrilldownTransaction[]> = {
  Żywność: [
    { id: 'tx-1', title: 'BIEDRONKA', amount: 87.43, date: '2025-06-25' },
    { id: 'tx-2', title: 'LIDL', amount: 123.9, date: '2025-06-22' },
    { id: 'tx-3', title: 'ŻABKA', amount: 34.5, date: '2025-06-20' },
    { id: 'tx-4', title: 'AUCHAN', amount: 210.0, date: '2025-06-18' },
    { id: 'tx-5', title: 'BIEDRONKA', amount: 65.2, date: '2025-06-15' },
  ],
  Transport: [
    { id: 'tx-6', title: 'ORLEN', amount: 280.0, date: '2025-06-24' },
    { id: 'tx-7', title: 'BOLT', amount: 32.5, date: '2025-06-21' },
    { id: 'tx-8', title: 'PKP INTERCITY', amount: 89.0, date: '2025-06-19' },
    { id: 'tx-9', title: 'ORLEN', amount: 310.0, date: '2025-06-12' },
  ],
  Subskrypcje: [
    { id: 'tx-10', title: 'NETFLIX', amount: 43.0, date: '2025-06-15' },
    { id: 'tx-11', title: 'SPOTIFY', amount: 23.99, date: '2025-06-15' },
    { id: 'tx-12', title: 'CHATGPT PLUS', amount: 92.0, date: '2025-06-14' },
    { id: 'tx-13', title: 'GITHUB', amount: 17.0, date: '2025-06-01' },
  ],
  'Jedzenie na mieście': [
    { id: 'tx-14', title: 'UBER EATS', amount: 67.8, date: '2025-06-26' },
    { id: 'tx-15', title: 'PIZZA HUT', amount: 89.0, date: '2025-06-23' },
    { id: 'tx-16', title: 'STARBUCKS', amount: 28.5, date: '2025-06-20' },
  ],
  Rachunki: [
    { id: 'tx-17', title: 'PGE ENERGIA', amount: 320.0, date: '2025-06-10' },
    { id: 'tx-18', title: 'PLAY', amount: 65.0, date: '2025-06-05' },
    { id: 'tx-19', title: 'INTERNET ORANGE', amount: 89.0, date: '2025-06-01' },
  ],
  Rozrywka: [
    { id: 'tx-20', title: 'CINEMA CITY', amount: 56.0, date: '2025-06-22' },
    { id: 'tx-21', title: 'STEAM', amount: 129.0, date: '2025-06-18' },
    { id: 'tx-22', title: 'EMPIK', amount: 45.99, date: '2025-06-10' },
  ],
  Wynagrodzenie: [
    {
      id: 'tx-23',
      title: 'PRZELEW PRACODAWCA',
      amount: 7000.0,
      date: '2025-06-01',
    },
  ],
  Freelance: [
    {
      id: 'tx-24',
      title: 'FAKTURA #2025-06',
      amount: 1000.0,
      date: '2025-06-15',
    },
  ],
  Inne: [
    { id: 'tx-25', title: 'ZWROT ALLEGRO', amount: 350.0, date: '2025-06-20' },
    {
      id: 'tx-26',
      title: 'PRZELEW OD MARKA',
      amount: 150.0,
      date: '2025-06-12',
    },
  ],
};

const DEFAULT_TREND = [100, 120, 110, 130, 125, 115];
const DEFAULT_TRANSACTIONS: CategoryDrilldownTransaction[] = [
  { id: 'tx-default', title: 'TRANSAKCJA', amount: 100.0, date: '2025-06-01' },
];

export const useCategoryDrilldownQuery = (
  category: string,
  _filters: CategoryBreakdownFilters,
): QueryState<CategoryDrilldownData> => {
  const trendValues = MOCK_TRENDS[category] ?? DEFAULT_TREND;
  const trend: ChartSeries = {
    id: category,
    data: MONTHS.map(
      (month, i): ChartSeriesDataPoint => ({ x: month, y: trendValues[i]! }),
    ),
  };
  const transactions = MOCK_TRANSACTIONS[category] ?? DEFAULT_TRANSACTIONS;

  return {
    status: 'loaded',
    data: { trend, transactions },
  };
};
