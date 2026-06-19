export interface TransactionRecord {
  id: string;
  amount: number;
  currency: string;
  type: string;
  category_ids: string[];
  description: string;
  date: string;
  created_at: string;
}
