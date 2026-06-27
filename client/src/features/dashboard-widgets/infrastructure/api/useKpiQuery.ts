export interface KpiDto {
  readonly label: string;
  readonly value: string;
  readonly deltaPercent?: string;
  readonly trend?: 'up' | 'down' | 'neutral';
  readonly tooltip?: string;
}

interface KpiQueryResult {
  readonly data: KpiDto[];
  readonly isLoading: boolean;
}

const MOCK_DATA: KpiDto[] = [
  { label: 'Saldo', value: '12 450,00 zł', deltaPercent: '+2,4%', trend: 'up', tooltip: 'Suma wszystkich środków na kontach. Zmiana procentowa vs poprzedni miesiąc.' },
  { label: 'Przychody', value: '8 500,00 zł', deltaPercent: '+12%', trend: 'up', tooltip: 'Łączne wpływy w bieżącym miesiącu (wynagrodzenie, przelewy przychodzące).' },
  { label: 'Wydatki', value: '6 050,00 zł', deltaPercent: '+5,3%', trend: 'down', tooltip: 'Suma wydatków w bieżącym miesiącu. Wzrost oznacza większe wydatki niż wcześniej.' },
  { label: 'Oszczędności', value: '2 450,00 zł', tooltip: 'Różnica między przychodami a wydatkami w tym miesiącu.' },
];

export const useKpiQuery = (): KpiQueryResult => ({
  data: MOCK_DATA,
  isLoading: false,
});
