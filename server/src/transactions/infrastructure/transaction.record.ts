export interface TransactionRecord {
  id: string;
  workspace_id: string;
  account_id: string;
  amount: number;
  currency: string;
  type: string;
  category_ids: readonly string[];
  description: string;
  date: string;
  created_at: string;
  content_hash?: string;
  balance?: number;
}
