import type {
  AnalyticsFilters,
  AnalyticsKpi,
  AnalyticsSeries,
  MetricType,
} from '#features/analytics/model/types';
import type { QueryState } from '#shared/api';

interface AnalyticsData {
  readonly series: AnalyticsSeries[];
  readonly kpis: AnalyticsKpi[];
}

const MOCK_SERIES: Record<MetricType, AnalyticsSeries> = {
  balance: {
    id: 'Saldo',
    data: [
      { x: 'Sty', y: 10200 },
      { x: 'Lut', y: 11400 },
      { x: 'Mar', y: 10800 },
      { x: 'Kwi', y: 12100 },
      { x: 'Maj', y: 11900 },
      { x: 'Cze', y: 12450 },
    ],
  },
  income: {
    id: 'Przychody',
    data: [
      { x: 'Sty', y: 8500 },
      { x: 'Lut', y: 8500 },
      { x: 'Mar', y: 9200 },
      { x: 'Kwi', y: 8500 },
      { x: 'Maj', y: 8800 },
      { x: 'Cze', y: 8500 },
    ],
  },
  expenses: {
    id: 'Wydatki',
    data: [
      { x: 'Sty', y: 6800 },
      { x: 'Lut', y: 7200 },
      { x: 'Mar', y: 7100 },
      { x: 'Kwi', y: 6900 },
      { x: 'Maj', y: 7400 },
      { x: 'Cze', y: 7150 },
    ],
  },
  savings: {
    id: 'Oszczędności',
    data: [
      { x: 'Sty', y: 1700 },
      { x: 'Lut', y: 1300 },
      { x: 'Mar', y: 2100 },
      { x: 'Kwi', y: 1600 },
      { x: 'Maj', y: 1400 },
      { x: 'Cze', y: 1350 },
    ],
  },
};

const MOCK_KPIS: Record<MetricType, AnalyticsKpi> = {
  balance: {
    label: 'Aktualne saldo',
    value: '12 450,00 zł',
    delta: '+4,6%',
    trend: 'up',
  },
  income: {
    label: 'Przychód (bieżący)',
    value: '8 500,00 zł',
    delta: '−3,4%',
    trend: 'down',
  },
  expenses: {
    label: 'Wydatki (bieżący)',
    value: '7 150,00 zł',
    delta: '−3,4%',
    trend: 'down',
    invertColor: true,
  },
  savings: {
    label: 'Oszczędności',
    value: '1 350,00 zł',
    delta: '−3,6%',
    trend: 'down',
  },
};

export const useAnalyticsQuery = (
  filters: AnalyticsFilters,
): QueryState<AnalyticsData> => {
  const series = filters.metrics.map((metric) => MOCK_SERIES[metric]);
  const kpis = filters.metrics.map((metric) => MOCK_KPIS[metric]);

  return { status: 'loaded', data: { series, kpis } };
};
