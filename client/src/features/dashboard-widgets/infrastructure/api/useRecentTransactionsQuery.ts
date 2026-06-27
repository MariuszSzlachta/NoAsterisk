export interface RecentTransactionDto {
  readonly id: string;
  readonly merchant: string;
  readonly category: string;
  readonly date: string;
  readonly amount: string;
  readonly direction: 'income' | 'expense';
}

interface RecentTransactionsQueryResult {
  readonly data: RecentTransactionDto[];
  readonly isLoading: boolean;
}

const MOCK_DATA: RecentTransactionDto[] = [
  { id: '1', merchant: 'BIEDRONKA', category: 'Zakupy', date: '27 cze', amount: '−87,43 zł', direction: 'expense' },
  { id: '2', merchant: 'SPOTIFY', category: 'Subskrypcje', date: '26 cze', amount: '−29,99 zł', direction: 'expense' },
  { id: '3', merchant: 'Przelew przychodzący', category: 'Wynagrodzenie', date: '25 cze', amount: '+8 500,00 zł', direction: 'income' },
  { id: '4', merchant: 'UBER', category: 'Transport', date: '24 cze', amount: '−34,50 zł', direction: 'expense' },
  { id: '5', merchant: 'ALLEGRO', category: 'Zakupy', date: '23 cze', amount: '−249,00 zł', direction: 'expense' },
];

export const useRecentTransactionsQuery = (): RecentTransactionsQueryResult => ({
  data: MOCK_DATA,
  isLoading: false,
});
