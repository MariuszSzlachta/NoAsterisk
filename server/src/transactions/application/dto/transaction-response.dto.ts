export interface TransactionResponseDto {
  id: string;
  accountId: string;
  amount: number;
  currency: string;
  type: 'income' | 'expense' | 'adjustment';
  categoryIds: readonly string[];
  description: string;
  date: string;
  createdAt: string;
  balance?: number;
}
