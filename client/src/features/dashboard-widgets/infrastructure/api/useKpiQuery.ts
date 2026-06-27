export interface KpiDto {
  readonly label: string;
  readonly value: string;
  readonly deltaPercent?: string;
  readonly trend?: 'up' | 'down' | 'neutral';
}

interface KpiQueryResult {
  readonly data: KpiDto[];
  readonly isLoading: boolean;
}

const MOCK_DATA: KpiDto[] = [
  { label: 'Saldo', value: '12 450,00 zł', deltaPercent: '+2,4%', trend: 'up' },
  { label: 'Przychody', value: '8 500,00 zł', deltaPercent: '+12%', trend: 'up' },
  { label: 'Wydatki', value: '6 050,00 zł', deltaPercent: '+5,3%', trend: 'down' },
  { label: 'Oszczędności', value: '2 450,00 zł' },
];

export const useKpiQuery = (): KpiQueryResult => ({
  data: MOCK_DATA,
  isLoading: false,
});
