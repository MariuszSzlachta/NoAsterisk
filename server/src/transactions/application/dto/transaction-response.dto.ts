export interface TransactionResponseDto {
  id: string;
  amount: number;
  currency: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  createdAt: string;
}
