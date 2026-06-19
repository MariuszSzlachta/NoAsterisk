export interface TransactionResponseDto {
  id: string;
  amount: number;
  currency: string;
  type: 'income' | 'expense';
  categoryIds: string[];
  description: string;
  date: string;
  createdAt: string;
}
